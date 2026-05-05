const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  lastMessage: {
    content: { 
      type: String, 
      maxlength: 1000,
      default: '' 
    },
    senderId: { 
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'lastMessage.senderModel'
    },
    senderModel: {
      type: String,
      enum: ['Doctor', 'Patient']
    },
    timestamp: { 
      type: Date 
    },
    type: { 
      type: String, 
      enum: ['text', 'file', 'image'],
      default: 'text'
    }
  },
  unreadCount: {
    doctor: { 
      type: Number, 
      default: 0,
      min: 0
    },
    patient: { 
      type: Number, 
      default: 0,
      min: 0
    }
  },
  isArchived: {
    doctor: { 
      type: Boolean, 
      default: false 
    },
    patient: { 
      type: Boolean, 
      default: false 
    }
  },
  isEmergency: { 
    type: Boolean, 
    default: false 
  },
  // HIPAA data retention fields (Req 19.6, 22.2)
  retentionArchived: {
    type: Boolean,
    default: false,
  },
  retentionArchivedAt: {
    type: Date,
  },
  metadata: {
    totalMessages: { 
      type: Number, 
      default: 0,
      min: 0
    },
    firstMessageAt: { 
      type: Date 
    },
    lastActivityAt: { 
      type: Date,
      default: Date.now
    }
  }
}, { timestamps: true });

// Compound unique index on (doctorId, patientId)
conversationSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });

// Index for querying conversations by doctor
conversationSchema.index({ doctorId: 1, 'metadata.lastActivityAt': -1 });

// Index for querying conversations by patient
conversationSchema.index({ patientId: 1, 'metadata.lastActivityAt': -1 });

// Index for emergency conversations
conversationSchema.index({ isEmergency: 1 });

// Pre-save validation to ensure doctor-patient relationship exists
conversationSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Check if doctor exists
      const Doctor = mongoose.model('Doctor');
      const doctor = await Doctor.findById(this.doctorId);
      if (!doctor) {
        const err = new Error('Invalid doctor ID: Doctor does not exist');
        err.statusCode = 400;
        throw err;
      }

      // Check if patient exists
      const Patient = mongoose.model('Patient');
      const patient = await Patient.findById(this.patientId);
      if (!patient) {
        const err = new Error('Invalid patient ID: Patient does not exist');
        err.statusCode = 400;
        throw err;
      }

      // Validate doctor-patient assignment relationship.
      // patient.docID is the doctor's *numeric* doctorId field (not the ObjectId).
      // doctor.doctorId is the numeric ID; this.doctorId is the Doctor ObjectId (_id).
      // So we compare patient.docID (numeric) with doctor.doctorId (numeric).
      if (!patient.docID || Number(patient.docID) !== Number(doctor.doctorId)) {
        const err = new Error('No active doctor-patient assignment exists');
        err.statusCode = 400;
        throw err;
      }

      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

const Conversation = mongoose.model("Conversation", conversationSchema);

// Helper functions for conversation management

/**
 * Create a new conversation between a doctor and patient
 */
const createConversation = async (doctorId, patientId) => {
  const conversation = new Conversation({
    doctorId,
    patientId
  });
  return await conversation.save();
};

/**
 * Find or create a conversation between a doctor and patient
 */
const findOrCreateConversation = async (doctorId, patientId) => {
  let conversation = await Conversation.findOne({ doctorId, patientId });
  
  if (!conversation) {
    conversation = await createConversation(doctorId, patientId);
  }
  
  return conversation;
};

/**
 * Get all conversations for a user (doctor or patient)
 */
const getUserConversations = async (userId, userType, options = {}) => {
  const {
    includeArchived = false,
    page = 1,
    limit = 20,
    emergencyOnly = false
  } = options;

  const query = {};
  
  // Set user filter based on type
  if (userType === 'doctor') {
    query.doctorId = userId;
    if (!includeArchived) {
      query['isArchived.doctor'] = false;
    }
  } else if (userType === 'patient') {
    query.patientId = userId;
    if (!includeArchived) {
      query['isArchived.patient'] = false;
    }
  } else {
    throw new Error('Invalid user type. Must be "doctor" or "patient"');
  }

  // Filter by emergency if requested
  if (emergencyOnly) {
    query.isEmergency = true;
  }

  const skip = (page - 1) * limit;

  const conversations = await Conversation.find(query)
    .populate('doctorId', 'name email profilePicture')
    .populate('patientId', 'name email profilePicture')
    .sort({ 'metadata.lastActivityAt': -1 })
    .skip(skip)
    .limit(limit);

  const total = await Conversation.countDocuments(query);

  return {
    conversations,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit)
    }
  };
};

/**
 * Get a specific conversation by ID
 */
const getConversationById = async (conversationId) => {
  return await Conversation.findById(conversationId)
    .populate('doctorId', 'name email profilePicture')
    .populate('patientId', 'name email profilePicture');
};

/**
 * Update conversation's last message
 */
const updateLastMessage = async (conversationId, messageData) => {
  const { content, senderId, senderModel, type } = messageData;
  
  return await Conversation.findByIdAndUpdate(
    conversationId,
    {
      'lastMessage.content': content.substring(0, 1000),
      'lastMessage.senderId': senderId,
      'lastMessage.senderModel': senderModel,
      'lastMessage.timestamp': new Date(),
      'lastMessage.type': type,
      'metadata.lastActivityAt': new Date(),
      $inc: { 'metadata.totalMessages': 1 }
    },
    { new: true }
  );
};

/**
 * Increment unread count for a user
 */
const incrementUnreadCount = async (conversationId, userType) => {
  const field = userType === 'doctor' ? 'unreadCount.doctor' : 'unreadCount.patient';
  
  return await Conversation.findByIdAndUpdate(
    conversationId,
    { $inc: { [field]: 1 } },
    { new: true }
  );
};

/**
 * Reset unread count for a user
 */
const resetUnreadCount = async (conversationId, userType) => {
  const field = userType === 'doctor' ? 'unreadCount.doctor' : 'unreadCount.patient';
  
  return await Conversation.findByIdAndUpdate(
    conversationId,
    { [field]: 0 },
    { new: true }
  );
};

/**
 * Archive a conversation for a specific user
 */
const archiveConversation = async (conversationId, userType) => {
  const field = userType === 'doctor' ? 'isArchived.doctor' : 'isArchived.patient';
  
  return await Conversation.findByIdAndUpdate(
    conversationId,
    { [field]: true },
    { new: true }
  );
};

/**
 * Unarchive a conversation for a specific user
 */
const unarchiveConversation = async (conversationId, userType) => {
  const field = userType === 'doctor' ? 'isArchived.doctor' : 'isArchived.patient';
  
  return await Conversation.findByIdAndUpdate(
    conversationId,
    { [field]: false },
    { new: true }
  );
};

/**
 * Flag a conversation as emergency
 */
const flagAsEmergency = async (conversationId) => {
  return await Conversation.findByIdAndUpdate(
    conversationId,
    { isEmergency: true },
    { new: true }
  );
};

/**
 * Clear emergency flag from a conversation
 */
const clearEmergencyFlag = async (conversationId) => {
  return await Conversation.findByIdAndUpdate(
    conversationId,
    { isEmergency: false },
    { new: true }
  );
};

/**
 * Get total unread count for a user across all conversations
 */
const getTotalUnreadCount = async (userId, userType) => {
  const query = {};
  const unreadField = userType === 'doctor' ? 'unreadCount.doctor' : 'unreadCount.patient';
  
  if (userType === 'doctor') {
    query.doctorId = userId;
    query['isArchived.doctor'] = false;
  } else if (userType === 'patient') {
    query.patientId = userId;
    query['isArchived.patient'] = false;
  } else {
    throw new Error('Invalid user type. Must be "doctor" or "patient"');
  }

  const result = await Conversation.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: `$${unreadField}` } } }
  ]);

  return result.length > 0 ? result[0].total : 0;
};

/**
 * Validate if a user has access to a conversation
 */
const validateUserAccess = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation) {
    return false;
  }

  return (
    conversation.doctorId.toString() === userId.toString() ||
    conversation.patientId.toString() === userId.toString()
  );
};

/**
 * Set first message timestamp if not already set
 */
const setFirstMessageTimestamp = async (conversationId) => {
  const conversation = await Conversation.findById(conversationId);
  
  if (conversation && !conversation.metadata.firstMessageAt) {
    conversation.metadata.firstMessageAt = new Date();
    await conversation.save();
  }
  
  return conversation;
};

module.exports = {
  Conversation,
  createConversation,
  findOrCreateConversation,
  getUserConversations,
  getConversationById,
  updateLastMessage,
  incrementUnreadCount,
  resetUnreadCount,
  archiveConversation,
  unarchiveConversation,
  flagAsEmergency,
  clearEmergencyFlag,
  getTotalUnreadCount,
  validateUserAccess,
  setFirstMessageTimestamp
};
