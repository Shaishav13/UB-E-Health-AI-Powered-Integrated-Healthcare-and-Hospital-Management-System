
const {
  Conversation,
  getConversationById,
  getUserConversations: modelGetUserConversations,
  updateLastMessage,
  incrementUnreadCount,
  archiveConversation: modelArchiveConversation,
  unarchiveConversation: modelUnarchiveConversation,
  flagAsEmergency: conversationFlagAsEmergency,
  getTotalUnreadCount,
  validateUserAccess,
  setFirstMessageTimestamp,
} = require('../models/Conversation.model');

const {
  Message,
  createMessage,
  getConversationMessages,
  getMessageById,
  markAsDelivered: modelMarkAsDelivered,
  markAsRead: modelMarkAsRead,
  deleteMessage: modelDeleteMessage,
  searchMessages: modelSearchMessages,
  flagAsEmergency: messageFlagAsEmergency,
  validateMessageAccess,
} = require('../models/Message.model');

const { ChatFile } = require('../models/ChatFile.model');

const { sanitizeMessageContent } = require('../utils/sanitizer');
const {
  validateMessageContent,
  validateConversationId,
  validateObjectId,
  validatePagination,
  validateSearchQuery,
  validateAttachments,
} = require('../utils/validators');

const redisHelpers = require('../utils/redisHelpers');
const { redis } = require('../configs/redis');
const auditLogger = require('./auditLogger');
const chatCache = require('./chatCacheService');

// Create a descriptive Error with an HTTP status code attached.
function createError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

// Send a message in a conversation.
async function sendMessage(data) {
  const {
    senderId,
    senderModel,
    senderName,
    conversationId,
    content,
    attachmentIds = [],
    isEmergency = false,
  } = data;

  // Input validation

  if (!validateObjectId(senderId ? senderId.toString() : '')) {
    throw createError('Invalid sender ID', 400);
  }

  const convValidation = validateConversationId(
    conversationId ? conversationId.toString() : ''
  );
  if (!convValidation.isValid) {
    throw createError(convValidation.error, 400);
  }

  const contentValidation = validateMessageContent(content);
  if (!contentValidation.isValid) {
    throw createError(contentValidation.error, 400);
  }

  if (!['Doctor', 'Patient'].includes(senderModel)) {
    throw createError('Invalid sender model. Must be Doctor or Patient', 400);
  }

  if (attachmentIds.length > 0) {
    const attachValidation = validateAttachments(
      attachmentIds.map((id) => (id ? id.toString() : ''))
    );
    if (!attachValidation.isValid) {
      throw createError(attachValidation.error, 400);
    }
  }

  // Access control

  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    throw createError('Conversation not found', 404);
  }

  const hasAccess = await validateUserAccess(conversationId, senderId);
  if (!hasAccess) {
    throw createError('Access denied: you are not a participant in this conversation', 403);
  }

  // Rate limiting

  const senderIdStr = senderId.toString();

  const hourlyCheck = await redisHelpers.checkRateLimit(redis, senderIdStr, 'message_hourly');
  if (!hourlyCheck.allowed) {
    auditLogger.logRateLimitViolation({
      userId: senderIdStr,
      limitType: 'message_hourly',
      count: hourlyCheck.count || 0,
      limit: hourlyCheck.limit || 100,
    });
    throw createError(
      `Rate limit exceeded. You can send at most ${hourlyCheck.limit} messages per hour. ` +
        `Resets in ${hourlyCheck.resetInSeconds} seconds.`,
      429
    );
  }

  const minuteCheck = await redisHelpers.checkRateLimit(redis, senderIdStr, 'message_minute');
  if (!minuteCheck.allowed) {
    auditLogger.logRateLimitViolation({
      userId: senderIdStr,
      limitType: 'message_minute',
      count: minuteCheck.count || 0,
      limit: minuteCheck.limit || 10,
    });
    throw createError(
      `Rate limit exceeded. You can send at most ${minuteCheck.limit} messages per minute. ` +
        `Resets in ${minuteCheck.resetInSeconds} seconds.`,
      429
    );
  }

  // Sanitize content

  const sanitizedContent = sanitizeMessageContent(content);
  if (!sanitizedContent || sanitizedContent.trim().length === 0) {
    throw createError('Message content is empty after sanitization', 400);
  }

  // Resolve attachments

  let attachments = [];
  if (attachmentIds.length > 0) {
    const fileRecords = await ChatFile.find({
      _id: { $in: attachmentIds },
      conversationId,
      isScanned: true,
      'scanResult.clean': true,
    }).lean();

    if (fileRecords.length !== attachmentIds.length) {
      throw createError(
        'One or more attachments are invalid, not scanned, or do not belong to this conversation',
        400
      );
    }

    attachments = fileRecords.map((f) => ({
      fileId: f._id,
      fileName: f.originalName || f.fileName,
      fileType: f.mimeType,
      fileSize: f.fileSize,
      fileUrl: f.fileUrl,
      thumbnailUrl: f.thumbnailUrl || undefined,
    }));
  }

  // Determine message type

  let messageType = 'text';
  if (attachments.length > 0) {
    const hasImage = attachments.some((a) =>
      ['image/jpeg', 'image/png'].includes(a.fileType)
    );
    messageType = hasImage ? 'image' : 'file';
  }

  // Persist message

  const message = await createMessage({
    conversationId,
    senderId,
    senderModel,
    content: sanitizedContent,
    type: messageType,
    attachments,
    isEmergency: isEmergency && senderModel === 'Patient', // only patients can flag emergency
    status: { sent: true, delivered: false, read: false },
  });

  // Update conversation metadata

  // Determine the recipient's role to increment their unread count
  const recipientType =
    conversation.doctorId.toString() === senderIdStr ? 'patient' : 'doctor';

  await Promise.all([
    updateLastMessage(conversationId, {
      content: sanitizedContent,
      senderId,
      senderModel,
      type: messageType,
    }),
    incrementUnreadCount(conversationId, recipientType),
    setFirstMessageTimestamp(conversationId),
  ]);

  // Increment rate-limit counters

  await Promise.all([
    redisHelpers.incrementRateLimit(redis, senderIdStr, 'message_hourly'),
    redisHelpers.incrementRateLimit(redis, senderIdStr, 'message_minute'),
  ]);

  // Clear typing indicator

  try {
    await redisHelpers.clearTyping(redis, conversationId.toString(), senderIdStr);
  } catch (_) {
    // Non-fatal – typing indicator cleanup should not block message delivery
  }

  // Invalidate conversation caches after the message is saved so the next read gets fresh data.
  try {
    await chatCache.invalidateConversationCaches(
      conversationId.toString(),
      conversation.doctorId.toString(),
      conversation.patientId.toString()
    );
    // Increment the recipient's cached unread count atomically
    await chatCache.incrementCachedUnreadCount(conversationId.toString(), recipientType);
  } catch (_) {
    // Non-fatal – cache invalidation should not block message delivery
  }

  // Audit log: message sent

  const recipientId =
    conversation.doctorId.toString() === senderIdStr
      ? conversation.patientId.toString()
      : conversation.doctorId.toString();

  auditLogger.logMessageSent({
    messageId: message._id.toString(),
    conversationId: conversationId.toString(),
    senderId: senderIdStr,
    senderModel,
    recipientId,
    recipientModel: senderModel === 'Doctor' ? 'Patient' : 'Doctor',
    messageType: message.type,
    isEmergency: message.isEmergency || false,
    contentLength: sanitizedContent.length,
  });

  return message;
}

// Get messages for a conversation with pagination.
// Validates that the requesting user is a participant before returning data.
async function getConversation(conversationId, userId, pagination = {}) {
  const convValidation = validateConversationId(
    conversationId ? conversationId.toString() : ''
  );
  if (!convValidation.isValid) {
    throw createError(convValidation.error, 400);
  }

  if (!validateObjectId(userId ? userId.toString() : '')) {
    throw createError('Invalid user ID', 400);
  }

  const { page = 1, limit = 50 } = pagination;
  const pageValidation = validatePagination(page, limit);
  if (!pageValidation.isValid) {
    throw createError(pageValidation.error, 400);
  }

  // Access control — try cache first, fall back to DB
  let conversation = await chatCache.getCachedConversation(conversationId);
  if (!conversation) {
    conversation = await getConversationById(conversationId);
    if (conversation) {
      await chatCache.cacheConversation(conversationId, conversation);
    }
  }
  if (!conversation) {
    throw createError('Conversation not found', 404);
  }

  const hasAccess =
    conversation.doctorId?.toString() === userId.toString() ||
    conversation.patientId?.toString() === userId.toString() ||
    (await validateUserAccess(conversationId, userId));

  if (!hasAccess) {
    throw createError('Access denied: you are not a participant in this conversation', 403);
  }

  const result = await getConversationMessages(conversationId, { page, limit });
  auditLogger.logConversationAccess({
    conversationId: conversationId.toString(),
    accessorId: userId.toString(),
    accessorModel: conversation.doctorId?.toString() === userId.toString() ? 'Doctor' : 'Patient',
    action: 'OPEN',
  });

  return {
    conversation,
    messages: result.messages,
    pagination: result.pagination,
  };
}

// Get all conversations for a user, sorted by last activity.
async function getUserConversations(userId, userType, options = {}) {
  if (!validateObjectId(userId ? userId.toString() : '')) {
    throw createError('Invalid user ID', 400);
  }

  if (!['doctor', 'patient'].includes(userType)) {
    throw createError('Invalid user type. Must be "doctor" or "patient"', 400);
  }

  const { page = 1, limit = 20, includeArchived = false, emergencyOnly = false } = options;

  const pageValidation = validatePagination(page, limit);
  if (!pageValidation.isValid) {
    throw createError(pageValidation.error, 400);
  }

  return await modelGetUserConversations(userId, userType, {
    page,
    limit,
    includeArchived,
    emergencyOnly,
  });
}

// Validate whether a user has access to a conversation.
async function validateConversationAccess(conversationId, userId) {
  if (
    !validateObjectId(conversationId ? conversationId.toString() : '') ||
    !validateObjectId(userId ? userId.toString() : '')
  ) {
    return false;
  }

  return await validateUserAccess(conversationId, userId);
}

// Mark a message as read.
// Only the recipient (not the sender) may mark a message as read.
// Decrements the reader's unread count in the conversation (floor 0).
async function markAsRead(messageId, userId) {
  if (!validateObjectId(messageId ? messageId.toString() : '')) {
    throw createError('Invalid message ID', 400);
  }
  if (!validateObjectId(userId ? userId.toString() : '')) {
    throw createError('Invalid user ID', 400);
  }

  const message = await getMessageById(messageId);
  if (!message) {
    throw createError('Message not found', 404);
  }

  if (message.isDeleted) {
    throw createError('Cannot mark a deleted message as read', 400);
  }

  // Verify the user is a participant in the conversation
  const hasAccess = await validateMessageAccess(messageId, userId);
  if (!hasAccess) {
    throw createError('Access denied: you are not a participant in this conversation', 403);
  }

  // Only the recipient (not the sender) should mark as read
  if (message.senderId.toString() === userId.toString()) {
    throw createError('Senders cannot mark their own messages as read', 400);
  }

  // Update message status
  const updatedMessage = await modelMarkAsRead(messageId);

  // Decrement unread count for the reader (floor at 0)
  const conversation = await getConversationById(message.conversationId);
  if (conversation) {
    const userRole =
      conversation.doctorId.toString() === userId.toString() ? 'doctor' : 'patient';
    const unreadField = `unreadCount.${userRole}`;

    await Conversation.findByIdAndUpdate(message.conversationId, [
      {
        $set: {
          [unreadField]: {
            $max: [{ $subtract: [`${unreadField}`, 1] }, 0],
          },
        },
      },
    ]);
  }

  // Audit log: message read
  auditLogger.logMessageRead({
    messageId: messageId.toString(),
    conversationId: message.conversationId.toString(),
    readerId: userId.toString(),
    readerModel: conversation
      ? (conversation.doctorId.toString() === userId.toString() ? 'Doctor' : 'Patient')
      : 'Unknown',
  });

  return updatedMessage;
}

// Mark a message as delivered.
// The recipient calls this to acknowledge delivery.
async function markAsDelivered(messageId, userId) {
  if (!validateObjectId(messageId ? messageId.toString() : '')) {
    throw createError('Invalid message ID', 400);
  }
  if (!validateObjectId(userId ? userId.toString() : '')) {
    throw createError('Invalid user ID', 400);
  }

  const message = await getMessageById(messageId);
  if (!message) {
    throw createError('Message not found', 404);
  }

  if (message.isDeleted) {
    throw createError('Cannot mark a deleted message as delivered', 400);
  }

  // Verify the user is a participant
  const hasAccess = await validateMessageAccess(messageId, userId);
  if (!hasAccess) {
    throw createError('Access denied: you are not a participant in this conversation', 403);
  }

  // Only the recipient should mark as delivered
  if (message.senderId.toString() === userId.toString()) {
    throw createError('Senders cannot mark their own messages as delivered', 400);
  }

  return await modelMarkAsDelivered(messageId);
}

// Soft-delete a message.
// Only the original sender may delete their own message.
// The message record is retained with isDeleted=true.
async function deleteMessage(messageId, userId) {
  if (!validateObjectId(messageId ? messageId.toString() : '')) {
    throw createError('Invalid message ID', 400);
  }
  if (!validateObjectId(userId ? userId.toString() : '')) {
    throw createError('Invalid user ID', 400);
  }

  const message = await getMessageById(messageId);
  if (!message) {
    throw createError('Message not found', 404);
  }

  if (message.isDeleted) {
    throw createError('Message has already been deleted', 400);
  }

  // Verify the user is a participant (access check)
  const hasAccess = await validateMessageAccess(messageId, userId);
  if (!hasAccess) {
    throw createError('Access denied: you are not a participant in this conversation', 403);
  }

  // Only the sender can delete their own message
  if (message.senderId.toString() !== userId.toString()) {
    throw createError('Only the sender can delete their own message', 403);
  }

  const deletedMessage = await modelDeleteMessage(messageId, userId);

  // Audit log: message deletion
  auditLogger.logMessageDeleted({
    messageId: messageId.toString(),
    conversationId: message.conversationId.toString(),
    deleterId: userId.toString(),
    deleterModel: message.senderModel || 'Unknown',
  });

  return deletedMessage;
}

// Search messages in a conversation.
// Excludes deleted messages. Case-insensitive. Max 100 results.
async function searchMessages(conversationId, userId, query, options = {}) {
  const convValidation = validateConversationId(
    conversationId ? conversationId.toString() : ''
  );
  if (!convValidation.isValid) {
    throw createError(convValidation.error, 400);
  }

  if (!validateObjectId(userId ? userId.toString() : '')) {
    throw createError('Invalid user ID', 400);
  }

  const queryValidation = validateSearchQuery(query);
  if (!queryValidation.isValid) {
    throw createError(queryValidation.error, 400);
  }

  // Access control
  const hasAccess = await validateUserAccess(conversationId, userId);
  if (!hasAccess) {
    throw createError('Access denied: you are not a participant in this conversation', 403);
  }

  const { limit = 100 } = options;
  const effectiveLimit = Math.min(limit, 100); // cap at 100

  const results = await modelSearchMessages(conversationId, query, { limit: effectiveLimit });

  // Audit log: conversation search access
  const searchConversation = await getConversationById(conversationId);
  auditLogger.logConversationAccess({
    conversationId: conversationId.toString(),
    accessorId: userId.toString(),
    accessorModel: searchConversation
      ? (searchConversation.doctorId.toString() === userId.toString() ? 'Doctor' : 'Patient')
      : 'Unknown',
    action: 'SEARCH',
  });

  return results;
}

// Archive a conversation for a specific user.
// Archiving is per-user: a doctor archiving a conversation does not affect the patient's view.
async function archiveConversation(conversationId, userId, userType) {
  const convValidation = validateConversationId(
    conversationId ? conversationId.toString() : ''
  );
  if (!convValidation.isValid) {
    throw createError(convValidation.error, 400);
  }

  if (!validateObjectId(userId ? userId.toString() : '')) {
    throw createError('Invalid user ID', 400);
  }

  if (!['doctor', 'patient'].includes(userType)) {
    throw createError('Invalid user type. Must be "doctor" or "patient"', 400);
  }

  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    throw createError('Conversation not found', 404);
  }

  // Verify the user is a participant
  const hasAccess = await validateUserAccess(conversationId, userId);
  if (!hasAccess) {
    throw createError('Access denied: you are not a participant in this conversation', 403);
  }

  const archivedConv = await modelArchiveConversation(conversationId, userType);

  // Audit log: conversation archived
  auditLogger.logConversationAccess({
    conversationId: conversationId.toString(),
    accessorId: userId.toString(),
    accessorModel: userType === 'doctor' ? 'Doctor' : 'Patient',
    action: 'ARCHIVE',
  });

  return archivedConv;
}

// Unarchive a conversation for a specific user.
async function unarchiveConversation(conversationId, userId, userType) {
  const convValidation = validateConversationId(
    conversationId ? conversationId.toString() : ''
  );
  if (!convValidation.isValid) {
    throw createError(convValidation.error, 400);
  }

  if (!validateObjectId(userId ? userId.toString() : '')) {
    throw createError('Invalid user ID', 400);
  }

  if (!['doctor', 'patient'].includes(userType)) {
    throw createError('Invalid user type. Must be "doctor" or "patient"', 400);
  }

  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    throw createError('Conversation not found', 404);
  }

  // Verify the user is a participant
  const hasAccess = await validateUserAccess(conversationId, userId);
  if (!hasAccess) {
    throw createError('Access denied: you are not a participant in this conversation', 403);
  }

  const unarchivedConv = await modelUnarchiveConversation(conversationId, userType);

  // Audit log: conversation unarchived
  auditLogger.logConversationAccess({
    conversationId: conversationId.toString(),
    accessorId: userId.toString(),
    accessorModel: userType === 'doctor' ? 'Doctor' : 'Patient',
    action: 'UNARCHIVE',
  });

  return unarchivedConv;
}

// Flag a message (and its conversation) as an emergency.
// Only patients may flag messages as emergency.
async function flagEmergency(messageId, userId, userType) {
  if (!validateObjectId(messageId ? messageId.toString() : '')) {
    throw createError('Invalid message ID', 400);
  }

  if (!validateObjectId(userId ? userId.toString() : '')) {
    throw createError('Invalid user ID', 400);
  }

  // Only patients can flag emergency
  if (userType !== 'patient') {
    throw createError('Only patients can flag messages as emergency', 403);
  }

  const message = await getMessageById(messageId);
  if (!message) {
    throw createError('Message not found', 404);
  }

  if (message.isDeleted) {
    throw createError('Cannot flag a deleted message as emergency', 400);
  }

  // Verify the user is a participant
  const hasAccess = await validateMessageAccess(messageId, userId);
  if (!hasAccess) {
    throw createError('Access denied: you are not a participant in this conversation', 403);
  }

  // Verify the user is the patient in this conversation
  const conversation = await getConversationById(message.conversationId);
  if (!conversation) {
    throw createError('Conversation not found', 404);
  }

  if (conversation.patientId.toString() !== userId.toString()) {
    throw createError('Only the patient in this conversation can flag emergency messages', 403);
  }

  // Flag both the message and the conversation
  const [updatedMessage, updatedConversation] = await Promise.all([
    messageFlagAsEmergency(messageId),
    conversationFlagAsEmergency(message.conversationId),
  ]);

  // Audit log: emergency flagged
  auditLogger.logEmergencyFlagged({
    messageId: messageId.toString(),
    conversationId: message.conversationId.toString(),
    patientId: userId.toString(),
  });

  return { message: updatedMessage, conversation: updatedConversation };
}

// Get the total unread message count for a user across all conversations.
async function getUnreadCount(userId, userType) {
  if (!validateObjectId(userId ? userId.toString() : '')) {
    throw createError('Invalid user ID', 400);
  }

  if (!['doctor', 'patient'].includes(userType)) {
    throw createError('Invalid user type. Must be "doctor" or "patient"', 400);
  }

  // Try cache first
  const cached = await chatCache.getCachedTotalUnreadCount(userId.toString(), userType);
  if (cached !== null) {
    return cached;
  }

  const count = await getTotalUnreadCount(userId, userType);

  // Populate cache for next request
  await chatCache.cacheTotalUnreadCount(userId.toString(), userType, count);

  return count;
}

module.exports = {
  sendMessage,
  getConversation,
  getUserConversations,
  validateConversationAccess,
  markAsRead,
  markAsDelivered,
  deleteMessage,
  searchMessages,
  archiveConversation,
  unarchiveConversation,
  flagEmergency,
  getUnreadCount,
};
