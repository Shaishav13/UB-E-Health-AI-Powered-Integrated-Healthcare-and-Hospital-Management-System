const mongoose = require("mongoose");

const chatFileSchema = new mongoose.Schema({
  conversationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Conversation', 
    required: true,
    index: true
  },
  messageId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Message',
    index: true
  },
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    refPath: 'uploaderModel'
  },
  uploaderModel: {
    type: String,
    required: true,
    enum: ['Doctor', 'Patient']
  },
  fileName: { 
    type: String, 
    required: true,
    unique: true
  },
  originalName: { 
    type: String, 
    required: true 
  },
  fileType: { 
    type: String, 
    required: true,
    enum: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
  },
  mimeType: { 
    type: String, 
    required: true,
    enum: [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  },
  fileSize: { 
    type: Number, 
    required: true,
    max: 10485760, // 10MB in bytes
    min: 1
  },
  filePath: { 
    type: String, 
    required: true 
  },
  fileUrl: { 
    type: String, 
    required: true 
  },
  thumbnailPath: { 
    type: String 
  },
  thumbnailUrl: { 
    type: String 
  },
  isScanned: { 
    type: Boolean, 
    default: false,
    required: true
  },
  scanResult: {
    clean: { 
      type: Boolean 
    },
    threats: [{ 
      type: String 
    }],
    scannedAt: { 
      type: Date 
    }
  },
  metadata: {
    width: { 
      type: Number 
    },
    height: { 
      type: Number 
    },
    duration: { 
      type: Number 
    }
  },
  expiresAt: { 
    type: Date 
  },
  // HIPAA data retention fields (Req 19.6, 22.2)
  retentionFlagged: {
    type: Boolean,
    default: false,
  },
  retentionFlaggedAt: {
    type: Date,
  },
}, { timestamps: true });

// Compound index on (conversationId, createdAt) for efficient file retrieval
chatFileSchema.index({ conversationId: 1, createdAt: -1 });

// Index on messageId for quick lookup of message attachments
chatFileSchema.index({ messageId: 1 });

// Index on uploadedBy for user file queries
chatFileSchema.index({ uploadedBy: 1 });

// Validation: file size must not exceed 10MB
chatFileSchema.path('fileSize').validate(function(value) {
  return value > 0 && value <= 10485760;
}, 'File size must be between 1 byte and 10MB (10485760 bytes)');

// Validation: fileType must match mimeType
chatFileSchema.path('mimeType').validate(function(value) {
  const validMappings = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'application/pdf': ['pdf'],
    'application/msword': ['doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx']
  };

  const allowedTypes = validMappings[value];
  return allowedTypes && allowedTypes.includes(this.fileType);
}, 'File type does not match MIME type');

// Validation: thumbnailUrl required for image types
chatFileSchema.path('thumbnailUrl').validate(function(value) {
  const isImage = ['image/jpeg', 'image/png'].includes(this.mimeType);
  if (isImage && this.isScanned && this.scanResult?.clean) {
    return !!value;
  }
  return true;
}, 'Thumbnail URL is required for image files');

// Pre-save validation
chatFileSchema.pre('save', async function(next) {
  try {
    // Validate conversation exists
    if (this.conversationId) {
      const Conversation = mongoose.model('Conversation');
      const conversation = await Conversation.findById(this.conversationId);
      if (!conversation) {
        throw new Error('Invalid conversation ID: Conversation does not exist');
      }

      // Validate uploader is a participant in the conversation
      const uploaderIdStr = this.uploadedBy.toString();
      const doctorIdStr = conversation.doctorId.toString();
      const patientIdStr = conversation.patientId.toString();

      if (uploaderIdStr !== doctorIdStr && uploaderIdStr !== patientIdStr) {
        throw new Error('Uploader is not a participant in this conversation');
      }

      // Validate uploaderModel matches the actual uploader type
      if (this.uploaderModel === 'Doctor' && uploaderIdStr !== doctorIdStr) {
        throw new Error('Uploader model mismatch: uploader is not the doctor in this conversation');
      }
      if (this.uploaderModel === 'Patient' && uploaderIdStr !== patientIdStr) {
        throw new Error('Uploader model mismatch: uploader is not the patient in this conversation');
      }
    }

    // Validate message exists if messageId is provided
    if (this.messageId) {
      const Message = mongoose.model('Message');
      const message = await Message.findById(this.messageId);
      if (!message) {
        throw new Error('Invalid message ID: Message does not exist');
      }

      // Ensure message belongs to the same conversation
      if (message.conversationId.toString() !== this.conversationId.toString()) {
        throw new Error('Message does not belong to the specified conversation');
      }
    }

    // Validate scan result if file is marked as scanned
    if (this.isScanned && !this.scanResult) {
      throw new Error('Scan result is required when file is marked as scanned');
    }

    if (this.isScanned && this.scanResult && this.scanResult.clean === undefined) {
      throw new Error('Scan result must indicate if file is clean');
    }

    next();
  } catch (error) {
    next(error);
  }
});

const ChatFile = mongoose.model("ChatFile", chatFileSchema);

// Helper functions for file management

/**
 * Create a new chat file record
 */
const createChatFile = async (fileData) => {
  const chatFile = new ChatFile(fileData);
  return await chatFile.save();
};

/**
 * Get a file by ID
 */
const getFileById = async (fileId) => {
  return await ChatFile.findById(fileId)
    .populate('uploadedBy', 'name profilePicture')
    .lean();
};

/**
 * Get all files for a conversation
 */
const getConversationFiles = async (conversationId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    fileType = null
  } = options;

  const query = { 
    conversationId,
    isScanned: true,
    'scanResult.clean': true
  };

  if (fileType) {
    query.fileType = fileType;
  }

  const skip = (page - 1) * limit;

  const files = await ChatFile.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('uploadedBy', 'name profilePicture')
    .lean();

  const total = await ChatFile.countDocuments(query);

  return {
    files,
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
 * Get files uploaded by a specific user
 */
const getUserFiles = async (userId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    conversationId = null
  } = options;

  const query = { 
    uploadedBy: userId,
    isScanned: true,
    'scanResult.clean': true
  };

  if (conversationId) {
    query.conversationId = conversationId;
  }

  const skip = (page - 1) * limit;

  const files = await ChatFile.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await ChatFile.countDocuments(query);

  return {
    files,
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
 * Update scan result for a file
 */
const updateScanResult = async (fileId, scanResult) => {
  return await ChatFile.findByIdAndUpdate(
    fileId,
    {
      isScanned: true,
      scanResult: {
        clean: scanResult.clean,
        threats: scanResult.threats || [],
        scannedAt: new Date()
      }
    },
    { new: true }
  );
};

/**
 * Delete a file
 */
const deleteFile = async (fileId, userId) => {
  const file = await ChatFile.findById(fileId);

  if (!file) {
    throw new Error('File not found');
  }

  // Verify the user is the uploader
  if (file.uploadedBy.toString() !== userId.toString()) {
    throw new Error('Only the uploader can delete this file');
  }

  await ChatFile.findByIdAndDelete(fileId);
  return file;
};

/**
 * Get files by message ID
 */
const getMessageFiles = async (messageId) => {
  return await ChatFile.find({
    messageId,
    isScanned: true,
    'scanResult.clean': true
  })
    .sort({ createdAt: 1 })
    .lean();
};

/**
 * Validate if a user can access a file
 */
const validateFileAccess = async (fileId, userId) => {
  const file = await ChatFile.findById(fileId);

  if (!file) {
    return false;
  }

  const Conversation = mongoose.model('Conversation');
  const conversation = await Conversation.findById(file.conversationId);

  if (!conversation) {
    return false;
  }

  return (
    conversation.doctorId.toString() === userId.toString() ||
    conversation.patientId.toString() === userId.toString()
  );
};

/**
 * Get file statistics for a conversation
 */
const getFileStats = async (conversationId) => {
  const stats = await ChatFile.aggregate([
    {
      $match: {
        conversationId: mongoose.Types.ObjectId(conversationId),
        isScanned: true,
        'scanResult.clean': true
      }
    },
    {
      $group: {
        _id: '$fileType',
        count: { $sum: 1 },
        totalSize: { $sum: '$fileSize' }
      }
    }
  ]);

  const totalFiles = await ChatFile.countDocuments({
    conversationId,
    isScanned: true,
    'scanResult.clean': true
  });

  const totalSize = await ChatFile.aggregate([
    {
      $match: {
        conversationId: mongoose.Types.ObjectId(conversationId),
        isScanned: true,
        'scanResult.clean': true
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$fileSize' }
      }
    }
  ]);

  return {
    totalFiles,
    totalSize: totalSize.length > 0 ? totalSize[0].total : 0,
    byType: stats
  };
};

/**
 * Clean up expired files
 */
const cleanupExpiredFiles = async () => {
  const now = new Date();
  const expiredFiles = await ChatFile.find({
    expiresAt: { $lte: now }
  });

  for (const file of expiredFiles) {
    await ChatFile.findByIdAndDelete(file._id);
  }

  return expiredFiles.length;
};

/**
 * Get unscanned files (for background processing)
 */
const getUnscannedFiles = async (limit = 10) => {
  return await ChatFile.find({
    isScanned: false
  })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();
};

module.exports = {
  ChatFile,
  createChatFile,
  getFileById,
  getConversationFiles,
  getUserFiles,
  updateScanResult,
  deleteFile,
  getMessageFiles,
  validateFileAccess,
  getFileStats,
  cleanupExpiredFiles,
  getUnscannedFiles
};
