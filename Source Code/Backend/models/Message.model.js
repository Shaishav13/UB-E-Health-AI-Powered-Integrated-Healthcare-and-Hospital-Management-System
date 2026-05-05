const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  conversationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Conversation', 
    required: true,
    index: true
  },
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    refPath: 'senderModel'
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['Doctor', 'Patient']
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 5000,
    trim: true
  },
  type: { 
    type: String, 
    required: true,
    enum: ['text', 'file', 'image', 'system'],
    default: 'text'
  },
  attachments: [{
    fileId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'ChatFile' 
    },
    fileName: { 
      type: String, 
      required: true 
    },
    fileType: { 
      type: String, 
      required: true 
    },
    fileSize: { 
      type: Number, 
      required: true,
      max: 10485760 // 10MB in bytes
    },
    fileUrl: { 
      type: String, 
      required: true 
    },
    thumbnailUrl: { 
      type: String 
    }
  }],
  status: {
    sent: { 
      type: Boolean, 
      default: true 
    },
    delivered: { 
      type: Boolean, 
      default: false 
    },
    read: { 
      type: Boolean, 
      default: false 
    },
    readAt: { 
      type: Date 
    }
  },
  isEmergency: { 
    type: Boolean, 
    default: false 
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  deletedAt: { 
    type: Date 
  }
}, { timestamps: true });

// Compound index on (conversationId, createdAt) for efficient message retrieval
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Index on (conversationId, isEmergency) for filtering emergency messages
messageSchema.index({ conversationId: 1, isEmergency: 1 });

// Index for searching messages by content
messageSchema.index({ content: 'text' });

// Validation: content must not be empty after trimming
messageSchema.path('content').validate(function(value) {
  return value && value.trim().length > 0;
}, 'Message content cannot be empty');

// Validation: attachments array max 5 items
messageSchema.path('attachments').validate(function(value) {
  return !value || value.length <= 5;
}, 'Maximum 5 attachments allowed per message');

// Pre-save validation
messageSchema.pre('save', async function(next) {
  try {
    // Validate conversation exists
    const Conversation = mongoose.model('Conversation');
    const conversation = await Conversation.findById(this.conversationId);
    if (!conversation) {
      throw new Error('Invalid conversation ID: Conversation does not exist');
    }

    // Validate sender exists and is a participant in the conversation
    const senderIdStr = this.senderId.toString();
    const doctorIdStr = conversation.doctorId.toString();
    const patientIdStr = conversation.patientId.toString();

    if (senderIdStr !== doctorIdStr && senderIdStr !== patientIdStr) {
      throw new Error('Sender is not a participant in this conversation');
    }

    // Validate senderModel matches the actual sender type
    if (this.senderModel === 'Doctor' && senderIdStr !== doctorIdStr) {
      throw new Error('Sender model mismatch: sender is not the doctor in this conversation');
    }
    if (this.senderModel === 'Patient' && senderIdStr !== patientIdStr) {
      throw new Error('Sender model mismatch: sender is not the patient in this conversation');
    }

    // Validate attachments if present
    if (this.attachments && this.attachments.length > 0) {
      for (const attachment of this.attachments) {
        // Validate file size
        if (attachment.fileSize > 10485760) {
          throw new Error(`Attachment ${attachment.fileName} exceeds 10MB limit`);
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

const Message = mongoose.model("Message", messageSchema);

// Helper functions for message management

/**
 * Create a new message
 */
const createMessage = async (messageData) => {
  const message = new Message(messageData);
  return await message.save();
};

/**
 * Get messages for a conversation with pagination.
 * Supports both offset-based (legacy) and cursor-based pagination.
 *
 * Cursor-based pagination (Req 20.4):
 *   Pass `cursor` (a message _id) to fetch messages older than that cursor.
 *   This is more efficient than offset pagination for large conversations.
 *
 * Offset-based pagination (legacy):
 *   Pass `page` and `limit` for traditional page-number pagination.
 */
const getConversationMessages = async (conversationId, options = {}) => {
  const {
    page = 1,
    limit = 50,
    includeDeleted = false,
    cursor = null,       // ObjectId string — fetch messages BEFORE this id
  } = options;

  const query = { conversationId };

  if (!includeDeleted) {
    query.isDeleted = false;
  }

  let messages;
  let total;
  let paginationMeta;

  if (cursor) {
    // ── Cursor-based pagination (Req 20.4) ──────────────────────────────────
    // Fetch `limit` messages with _id < cursor, sorted descending, then reverse
    query._id = { $lt: cursor };

    messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate('senderId', 'name profilePicture')
      .lean();

    // Reverse so oldest is first (ascending display order)
    messages = messages.reverse();

    // Check if there are more messages before the oldest returned
    const hasMore = messages.length === limit
      ? !!(await Message.findOne({ ...query, _id: { $lt: messages[0]?._id } }).lean())
      : false;

    paginationMeta = {
      cursor: messages.length > 0 ? messages[0]._id : null,
      nextCursor: hasMore ? messages[0]?._id : null,
      hasMore,
      limit,
      count: messages.length,
    };
  } else {
    // ── Offset-based pagination (legacy) ────────────────────────────────────
    const skip = (page - 1) * limit;

    messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'name profilePicture')
      .lean();

    total = await Message.countDocuments(query);

    paginationMeta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
      currentPage: page,
    };

    // Return oldest first for display
    messages = messages.reverse();
  }

  return {
    messages,
    pagination: paginationMeta,
  };
};

/**
 * Get a specific message by ID
 */
const getMessageById = async (messageId) => {
  return await Message.findById(messageId)
    .populate('senderId', 'name profilePicture');
};

/**
 * Mark a message as delivered
 */
const markAsDelivered = async (messageId) => {
  return await Message.findByIdAndUpdate(
    messageId,
    { 
      'status.delivered': true 
    },
    { new: true }
  );
};

/**
 * Mark a message as read
 */
const markAsRead = async (messageId) => {
  return await Message.findByIdAndUpdate(
    messageId,
    { 
      'status.read': true,
      'status.delivered': true,
      'status.readAt': new Date()
    },
    { new: true }
  );
};

/**
 * Soft delete a message
 */
const deleteMessage = async (messageId, userId) => {
  const message = await Message.findById(messageId);
  
  if (!message) {
    throw new Error('Message not found');
  }

  // Verify the user is the sender
  if (message.senderId.toString() !== userId.toString()) {
    throw new Error('Only the sender can delete this message');
  }

  message.isDeleted = true;
  message.deletedAt = new Date();
  await message.save();

  return message;
};

/**
 * Search messages in a conversation
 */
const searchMessages = async (conversationId, searchQuery, options = {}) => {
  const { limit = 100 } = options;

  if (!searchQuery || searchQuery.trim().length < 2) {
    throw new Error('Search query must be at least 2 characters');
  }

  const sanitizedQuery = searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const searchRegex = new RegExp(sanitizedQuery, 'i');

  const messages = await Message.find({
    conversationId,
    isDeleted: false,
    $or: [
      { content: searchRegex },
      { 'attachments.fileName': searchRegex }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('senderId', 'name profilePicture')
    .lean();

  return messages;
};

/**
 * Get unread messages count for a user in a conversation
 */
const getUnreadCount = async (conversationId, userId) => {
  const conversation = await mongoose.model('Conversation').findById(conversationId);
  
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Determine if user is doctor or patient
  const isDoctor = conversation.doctorId.toString() === userId.toString();
  const isPatient = conversation.patientId.toString() === userId.toString();

  if (!isDoctor && !isPatient) {
    throw new Error('User is not a participant in this conversation');
  }

  // Count unread messages sent by the other participant
  const otherParticipantId = isDoctor ? conversation.patientId : conversation.doctorId;

  return await Message.countDocuments({
    conversationId,
    senderId: otherParticipantId,
    'status.read': false,
    isDeleted: false
  });
};

/**
 * Mark all messages as read for a user in a conversation
 */
const markAllAsRead = async (conversationId, userId) => {
  const conversation = await mongoose.model('Conversation').findById(conversationId);
  
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Determine if user is doctor or patient
  const isDoctor = conversation.doctorId.toString() === userId.toString();
  const isPatient = conversation.patientId.toString() === userId.toString();

  if (!isDoctor && !isPatient) {
    throw new Error('User is not a participant in this conversation');
  }

  // Mark all messages from the other participant as read
  const otherParticipantId = isDoctor ? conversation.patientId : conversation.doctorId;

  return await Message.updateMany(
    {
      conversationId,
      senderId: otherParticipantId,
      'status.read': false,
      isDeleted: false
    },
    {
      'status.read': true,
      'status.delivered': true,
      'status.readAt': new Date()
    }
  );
};

/**
 * Get emergency messages in a conversation
 */
const getEmergencyMessages = async (conversationId) => {
  return await Message.find({
    conversationId,
    isEmergency: true,
    isDeleted: false
  })
    .sort({ createdAt: -1 })
    .populate('senderId', 'name profilePicture')
    .lean();
};

/**
 * Flag a message as emergency
 */
const flagAsEmergency = async (messageId) => {
  return await Message.findByIdAndUpdate(
    messageId,
    { isEmergency: true },
    { new: true }
  );
};

/**
 * Get the last message in a conversation
 */
const getLastMessage = async (conversationId) => {
  return await Message.findOne({
    conversationId,
    isDeleted: false
  })
    .sort({ createdAt: -1 })
    .populate('senderId', 'name profilePicture')
    .lean();
};

/**
 * Validate if a user can access a message
 */
const validateMessageAccess = async (messageId, userId) => {
  const message = await Message.findById(messageId);
  
  if (!message) {
    return false;
  }

  const conversation = await mongoose.model('Conversation').findById(message.conversationId);
  
  if (!conversation) {
    return false;
  }

  return (
    conversation.doctorId.toString() === userId.toString() ||
    conversation.patientId.toString() === userId.toString()
  );
};

module.exports = {
  Message,
  createMessage,
  getConversationMessages,
  getMessageById,
  markAsDelivered,
  markAsRead,
  deleteMessage,
  searchMessages,
  getUnreadCount,
  markAllAsRead,
  getEmergencyMessages,
  flagAsEmergency,
  getLastMessage,
  validateMessageAccess
};
