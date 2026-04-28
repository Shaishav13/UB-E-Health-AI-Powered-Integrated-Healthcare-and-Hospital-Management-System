'use strict';

/**
 * Chat Service – Core Business Logic
 *
 * Orchestrates models, utilities, and Redis to implement all chat operations.
 * This is the single authoritative layer for:
 *   - Sending messages (validation, rate limiting, sanitization, persistence)
 *   - Retrieving conversations and message history
 *   - Message status updates (read, delivered, delete)
 *   - Conversation management (archive, emergency flag)
 *   - Unread count tracking
 *
 * Requirements: 1.1, 1.2, 1.5, 1.7, 3.1, 3.2, 6.3, 6.4, 6.6, 8.1, 8.2, 8.7,
 *               9.1, 9.2, 9.4, 10.1, 10.2, 10.6, 11.1, 11.6, 12.1, 12.2,
 *               13.1, 13.2, 14.1, 14.2, 15.1, 15.2, 15.4
 */

// ─── Dependencies ─────────────────────────────────────────────────────────────

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

// ─── Error factory ────────────────────────────────────────────────────────────

/**
 * Create a descriptive Error with an HTTP status code attached.
 * @param {string} message
 * @param {number} statusCode
 * @returns {Error}
 */
function createError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBTASK 5.1 – Core send / retrieve operations
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send a message in a conversation.
 *
 * Steps:
 *   1. Validate inputs (conversationId, content, attachments)
 *   2. Verify the sender has access to the conversation
 *   3. Check hourly and per-minute rate limits
 *   4. Sanitize message content
 *   5. Resolve attachment metadata from ChatFile records
 *   6. Persist the message
 *   7. Update conversation metadata (lastMessage, unreadCount, firstMessageAt)
 *   8. Increment rate-limit counters
 *   9. Clear typing indicator for the sender
 *
 * @param {object} data
 * @param {string} data.senderId       - MongoDB ObjectId of the sender
 * @param {string} data.senderModel    - 'Doctor' | 'Patient'
 * @param {string} data.senderName     - Display name of the sender
 * @param {string} data.conversationId - Target conversation ObjectId
 * @param {string} data.content        - Raw message text (will be sanitized)
 * @param {string[]} [data.attachmentIds] - Array of ChatFile ObjectIds (max 5)
 * @param {boolean} [data.isEmergency] - Emergency flag (patients only)
 * @returns {Promise<Message>} The saved message document
 *
 * Requirements: 1.1, 1.2, 1.5, 1.7, 12.1, 12.2
 */
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

  // ── 1. Input validation ──────────────────────────────────────────────────

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

  // ── 2. Access control ────────────────────────────────────────────────────

  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    throw createError('Conversation not found', 404);
  }

  const hasAccess = await validateUserAccess(conversationId, senderId);
  if (!hasAccess) {
    throw createError('Access denied: you are not a participant in this conversation', 403);
  }

  // ── 3. Rate limiting ─────────────────────────────────────────────────────

  const senderIdStr = senderId.toString();

  const hourlyCheck = await redisHelpers.checkRateLimit(redis, senderIdStr, 'message_hourly');
  if (!hourlyCheck.allowed) {
    throw createError(
      `Rate limit exceeded. You can send at most ${hourlyCheck.limit} messages per hour. ` +
        `Resets in ${hourlyCheck.resetInSeconds} seconds.`,
      429
    );
  }

  const minuteCheck = await redisHelpers.checkRateLimit(redis, senderIdStr, 'message_minute');
  if (!minuteCheck.allowed) {
    throw createError(
      `Rate limit exceeded. You can send at most ${minuteCheck.limit} messages per minute. ` +
        `Resets in ${minuteCheck.resetInSeconds} seconds.`,
      429
    );
  }

  // ── 4. Sanitize content ──────────────────────────────────────────────────

  const sanitizedContent = sanitizeMessageContent(content);
  if (!sanitizedContent || sanitizedContent.trim().length === 0) {
    throw createError('Message content is empty after sanitization', 400);
  }

  // ── 5. Resolve attachments ───────────────────────────────────────────────

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

  // ── 6. Determine message type ────────────────────────────────────────────

  let messageType = 'text';
  if (attachments.length > 0) {
    const hasImage = attachments.some((a) =>
      ['image/jpeg', 'image/png'].includes(a.fileType)
    );
    messageType = hasImage ? 'image' : 'file';
  }

  // ── 7. Persist message ───────────────────────────────────────────────────

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

  // ── 8. Update conversation metadata ─────────────────────────────────────

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

  // ── 9. Increment rate-limit counters ─────────────────────────────────────

  await Promise.all([
    redisHelpers.incrementRateLimit(redis, senderIdStr, 'message_hourly'),
    redisHelpers.incrementRateLimit(redis, senderIdStr, 'message_minute'),
  ]);

  // ── 10. Clear typing indicator ───────────────────────────────────────────

  try {
    await redisHelpers.clearTyping(redis, conversationId.toString(), senderIdStr);
  } catch (_) {
    // Non-fatal – typing indicator cleanup should not block message delivery
  }

  return message;
}

/**
 * Get messages for a conversation with pagination.
 *
 * Validates that the requesting user is a participant before returning data.
 *
 * @param {string} conversationId
 * @param {string} userId          - The requesting user's ID
 * @param {object} [pagination]
 * @param {number} [pagination.page=1]
 * @param {number} [pagination.limit=50]
 * @returns {Promise<{conversation: Conversation, messages: Message[], pagination: object}>}
 *
 * Requirements: 13.1, 13.2, 14.1, 14.2
 */
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

  // Access control
  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    throw createError('Conversation not found', 404);
  }

  const hasAccess = await validateUserAccess(conversationId, userId);
  if (!hasAccess) {
    throw createError('Access denied: you are not a participant in this conversation', 403);
  }

  const result = await getConversationMessages(conversationId, { page, limit });

  return {
    conversation,
    messages: result.messages,
    pagination: result.pagination,
  };
}

/**
 * Get all conversations for a user, sorted by last activity.
 *
 * @param {string} userId
 * @param {'doctor'|'patient'} userType
 * @param {object} [options]
 * @param {number}  [options.page=1]
 * @param {number}  [options.limit=20]
 * @param {boolean} [options.includeArchived=false]
 * @param {boolean} [options.emergencyOnly=false]
 * @returns {Promise<{conversations: Conversation[], pagination: object}>}
 *
 * Requirements: 3.1, 3.2, 14.1, 14.2
 */
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

/**
 * Validate whether a user has access to a conversation.
 *
 * @param {string} conversationId
 * @param {string} userId
 * @returns {Promise<boolean>}
 *
 * Requirements: 3.1, 3.2
 */
async function validateConversationAccess(conversationId, userId) {
  if (
    !validateObjectId(conversationId ? conversationId.toString() : '') ||
    !validateObjectId(userId ? userId.toString() : '')
  ) {
    return false;
  }

  return await validateUserAccess(conversationId, userId);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBTASK 5.2 – Message operations
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Mark a message as read.
 *
 * Only the recipient (not the sender) may mark a message as read.
 * Decrements the reader's unread count in the conversation (floor 0).
 *
 * @param {string} messageId
 * @param {string} userId    - The user marking the message as read
 * @returns {Promise<Message>} Updated message document
 *
 * Requirements: 6.3, 6.4, 11.1
 */
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
            $max: [{ $subtract: [`$${unreadField}`, 1] }, 0],
          },
        },
      },
    ]);
  }

  return updatedMessage;
}

/**
 * Mark a message as delivered.
 *
 * The recipient calls this to acknowledge delivery.
 *
 * @param {string} messageId
 * @param {string} userId    - The user acknowledging delivery
 * @returns {Promise<Message>} Updated message document
 *
 * Requirements: 6.4, 6.6
 */
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

/**
 * Soft-delete a message.
 *
 * Only the original sender may delete their own message.
 * The message record is retained with isDeleted=true.
 *
 * @param {string} messageId
 * @param {string} userId    - Must be the sender
 * @returns {Promise<Message>} Updated (soft-deleted) message document
 *
 * Requirements: 8.1, 8.2, 8.7, 15.1, 15.2, 15.4
 */
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

  return await modelDeleteMessage(messageId, userId);
}

/**
 * Search messages in a conversation.
 *
 * Excludes deleted messages. Case-insensitive. Max 100 results.
 *
 * @param {string} conversationId
 * @param {string} userId          - Must be a participant
 * @param {string} query           - Search text (min 2 chars)
 * @param {object} [options]
 * @param {number} [options.limit=100]
 * @returns {Promise<Message[]>}
 *
 * Requirements: 8.1, 8.2, 8.7
 */
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

  return await modelSearchMessages(conversationId, query, { limit: effectiveLimit });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBTASK 5.3 – Conversation operations
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Archive a conversation for a specific user.
 *
 * Archiving is per-user: a doctor archiving a conversation does not affect
 * the patient's view, and vice versa.
 *
 * @param {string} conversationId
 * @param {string} userId
 * @param {'doctor'|'patient'} userType
 * @returns {Promise<Conversation>} Updated conversation document
 *
 * Requirements: 9.1, 9.2, 9.4
 */
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

  return await modelArchiveConversation(conversationId, userType);
}

/**
 * Unarchive a conversation for a specific user.
 *
 * @param {string} conversationId
 * @param {string} userId
 * @param {'doctor'|'patient'} userType
 * @returns {Promise<Conversation>} Updated conversation document
 *
 * Requirements: 9.1, 9.2, 9.4
 */
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

  return await modelUnarchiveConversation(conversationId, userType);
}

/**
 * Flag a message (and its conversation) as an emergency.
 *
 * Only patients may flag messages as emergency (Req 10.1, 10.6).
 *
 * @param {string} messageId
 * @param {string} userId
 * @param {'doctor'|'patient'} userType
 * @returns {Promise<{message: Message, conversation: Conversation}>}
 *
 * Requirements: 10.1, 10.2, 10.6
 */
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

  return { message: updatedMessage, conversation: updatedConversation };
}

/**
 * Get the total unread message count for a user across all conversations.
 *
 * @param {string} userId
 * @param {'doctor'|'patient'} userType
 * @returns {Promise<number>} Total unread count
 *
 * Requirements: 11.1, 11.6
 */
async function getUnreadCount(userId, userType) {
  if (!validateObjectId(userId ? userId.toString() : '')) {
    throw createError('Invalid user ID', 400);
  }

  if (!['doctor', 'patient'].includes(userType)) {
    throw createError('Invalid user type. Must be "doctor" or "patient"', 400);
  }

  return await getTotalUnreadCount(userId, userType);
}

// ─── Exports ──────────────────────────────────────────────────────────────────

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
