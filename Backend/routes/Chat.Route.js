'use strict';

/**
 * Chat REST API Routes
 *
 * Provides all HTTP endpoints for the Doctor-Patient Chat System:
 *
 *   Conversations
 *     GET    /api/chat/conversations              – list user's conversations
 *     GET    /api/chat/conversations/:id          – get conversation + messages
 *     POST   /api/chat/conversations              – create new conversation
 *     PUT    /api/chat/conversations/:id/archive  – archive conversation
 *     PUT    /api/chat/conversations/:id/unarchive– unarchive conversation
 *     GET    /api/chat/conversations/:id/search   – search messages
 *
 *   Messages
 *     GET    /api/chat/messages/:id               – get specific message
 *     DELETE /api/chat/messages/:id               – soft-delete message
 *     PUT    /api/chat/messages/:id/read          – mark message as read
 *     POST   /api/chat/messages/:id/emergency     – flag as emergency (patient only)
 *
 *   Files
 *     POST   /api/chat/upload                     – upload file
 *     GET    /api/chat/files/:id                  – get file + signed URL
 *     DELETE /api/chat/files/:id                  – delete file
 *
 *   Statistics
 *     GET    /api/chat/stats                      – chat statistics for user
 *     GET    /api/chat/unread-count               – total unread count
 *
 * Requirements: 3.1, 3.3, 4.1-4.3, 4.6-4.7, 4.10, 6.3, 8.1, 8.8,
 *               9.1, 9.4, 10.1, 10.6, 11.6, 11.7, 12.1-12.3, 13.1, 14.1, 15.1
 */

const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// ── Middleware ────────────────────────────────────────────────────────────────
const { authenticate, patientOnly } = require('../middlewares/chatAuth');

// ── Services ──────────────────────────────────────────────────────────────────
const chatService = require('../services/chatService');
const {
  chatUpload,
  uploadFile,
  getSignedUrl,
  deleteFileByName,
} = require('../services/fileStorageService');
const { validateFile, scanForMalware } = require('../services/fileValidationService');
const { generateThumbnail } = require('../services/thumbnailService');

// ── Models ────────────────────────────────────────────────────────────────────
const {
  Conversation,
  createConversation,
  getConversationById,
  validateUserAccess,
} = require('../models/Conversation.model');
const { getMessageById } = require('../models/Message.model');
const {
  ChatFile,
  createChatFile,
  getFileById,
  deleteFile: deleteFileRecord,
  validateFileAccess,
} = require('../models/ChatFile.model');
// Patient model is accessed via mongoose.model('Patient') after it's registered

// ── Redis (for file rate limiting) ───────────────────────────────────────────
let redisHelpers, redis;
try {
  redisHelpers = require('../utils/redisHelpers');
  redis = require('../configs/redis').redis;
} catch (_) {
  // Redis unavailable – rate limiting will be skipped gracefully
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate that a string is a valid MongoDB ObjectId.
 */
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Send a consistent error response.
 */
function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ success: false, message });
}

/**
 * Send a consistent success response.
 */
function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, ...data });
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply authentication to ALL chat routes
// ─────────────────────────────────────────────────────────────────────────────
router.use(authenticate);

// ═════════════════════════════════════════════════════════════════════════════
// TASK 7.1 – Conversation Routes
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/chat/conversations
 * List all conversations for the authenticated user with pagination.
 * Requirements: 3.1, 14.1, 14.2
 */
router.get('/conversations', async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const includeArchived = req.query.includeArchived === 'true';
    const emergencyOnly = req.query.emergencyOnly === 'true';

    const result = await chatService.getUserConversations(userId, userType, {
      page,
      limit,
      includeArchived,
      emergencyOnly,
    });

    return sendSuccess(res, {
      conversations: result.conversations,
      pagination: result.pagination,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || 'Failed to fetch conversations');
  }
});

/**
 * GET /api/chat/conversations/:id
 * Get a specific conversation with its paginated message history.
 * Requirements: 3.1, 13.1, 13.2
 */
router.get('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid conversation ID format');
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const result = await chatService.getConversation(id, userId, { page, limit });

    return sendSuccess(res, {
      conversation: result.conversation,
      messages: result.messages,
      pagination: result.pagination,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || 'Failed to fetch conversation');
  }
});

/**
 * POST /api/chat/conversations
 * Create a new conversation between a doctor and patient.
 * Validates that an active doctor-patient assignment exists.
 * Requirements: 3.3, 3.4
 */
router.post('/conversations', async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const { doctorId, patientId } = req.body;

    if (!doctorId || !patientId) {
      return sendError(res, 400, 'Both doctorId and patientId are required');
    }

    if (!isValidObjectId(doctorId) || !isValidObjectId(patientId)) {
      return sendError(res, 400, 'Invalid doctorId or patientId format');
    }

    // Ensure the requesting user is one of the participants
    if (userId !== doctorId && userId !== patientId) {
      return sendError(res, 403, 'You can only create conversations you participate in');
    }

    // Validate doctor-patient assignment:
    // Patient.docID stores the doctor's numeric doctorId, but Conversation.doctorId
    // stores the Doctor's ObjectId (_id). We need to look up the doctor by _id
    // and then check that the patient's docID matches the doctor's numeric doctorId.
    const Doctor = mongoose.model('Doctor');
    const PatientModel = mongoose.model('Patient');

    const [doctor, patient] = await Promise.all([
      Doctor.findById(doctorId),
      PatientModel.findById(patientId),
    ]);

    if (!doctor) {
      return sendError(res, 404, 'Doctor not found');
    }
    if (!patient) {
      return sendError(res, 404, 'Patient not found');
    }

    // patient.docID is the doctor's numeric doctorId field
    if (!patient.docID || patient.docID !== doctor.doctorId) {
      return sendError(
        res,
        400,
        'No active doctor-patient assignment exists between these users'
      );
    }

    // Check if conversation already exists (unique constraint)
    const existing = await Conversation.findOne({ doctorId, patientId });
    if (existing) {
      return sendSuccess(res, { conversation: existing }, 200);
    }

    // Create new conversation
    const conversation = await createConversation(doctorId, patientId);

    return sendSuccess(res, { conversation }, 201);
  } catch (error) {
    // Duplicate key error (race condition)
    if (error.code === 11000) {
      const existing = await Conversation.findOne({
        doctorId: req.body.doctorId,
        patientId: req.body.patientId,
      });
      return sendSuccess(res, { conversation: existing }, 200);
    }
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || 'Failed to create conversation');
  }
});

/**
 * PUT /api/chat/conversations/:id/archive
 * Archive a conversation for the authenticated user only.
 * Requirements: 9.1, 9.2
 */
router.put('/conversations/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userType } = req.user;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid conversation ID format');
    }

    const conversation = await chatService.archiveConversation(id, userId, userType);

    return sendSuccess(res, { conversation });
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || 'Failed to archive conversation');
  }
});

/**
 * PUT /api/chat/conversations/:id/unarchive
 * Unarchive a conversation for the authenticated user only.
 * Requirements: 9.4
 */
router.put('/conversations/:id/unarchive', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userType } = req.user;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid conversation ID format');
    }

    const conversation = await chatService.unarchiveConversation(id, userId, userType);

    return sendSuccess(res, { conversation });
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || 'Failed to unarchive conversation');
  }
});

/**
 * GET /api/chat/conversations/:id/search
 * Search messages within a conversation.
 * Requirements: 8.1, 8.8
 */
router.get('/conversations/:id/search', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { q, limit } = req.query;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid conversation ID format');
    }

    if (!q || q.trim().length < 2) {
      return sendError(res, 400, 'Search query must be at least 2 characters');
    }

    if (q.trim().length > 100) {
      return sendError(res, 400, 'Search query must not exceed 100 characters');
    }

    const effectiveLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 100));

    const messages = await chatService.searchMessages(id, userId, q.trim(), {
      limit: effectiveLimit,
    });

    return sendSuccess(res, { messages, count: messages.length, query: q.trim() });
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || 'Search failed');
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// TASK 7.2 – Message Routes
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/chat/messages/:id
 * Get a specific message by ID.
 * Requirements: 6.3
 */
router.get('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid message ID format');
    }

    const message = await getMessageById(id);
    if (!message) {
      return sendError(res, 404, 'Message not found');
    }

    // Verify the user is a participant in the conversation
    const hasAccess = await validateUserAccess(message.conversationId, userId);
    if (!hasAccess) {
      return sendError(res, 403, 'Access denied: you are not a participant in this conversation');
    }

    return sendSuccess(res, { message });
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || 'Failed to fetch message');
  }
});

/**
 * DELETE /api/chat/messages/:id
 * Soft-delete a message (sender only).
 * Requirements: 15.1
 */
router.delete('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid message ID format');
    }

    const message = await chatService.deleteMessage(id, userId);

    return sendSuccess(res, { message });
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || 'Failed to delete message');
  }
});

/**
 * PUT /api/chat/messages/:id/read
 * Mark a message as read (recipient only).
 * Requirements: 6.3
 */
router.put('/messages/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid message ID format');
    }

    const message = await chatService.markAsRead(id, userId);

    return sendSuccess(res, { message });
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || 'Failed to mark message as read');
  }
});

/**
 * POST /api/chat/messages/:id/emergency
 * Flag a message as emergency. Patients only.
 * Requirements: 10.1, 10.6
 */
router.post('/messages/:id/emergency', patientOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userType } = req.user;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid message ID format');
    }

    const result = await chatService.flagEmergency(id, userId, userType);

    return sendSuccess(res, {
      message: result.message,
      conversation: result.conversation,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || 'Failed to flag emergency');
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// TASK 7.3 – File Upload Routes
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/chat/upload
 * Upload a file attachment for a chat conversation.
 *
 * Multipart form fields:
 *   file          – the file (required)
 *   conversationId – target conversation ObjectId (required)
 *
 * Requirements: 4.1, 4.2, 4.3, 4.6, 4.7, 4.10
 */
router.post(
  '/upload',
  chatUpload.single('file'),
  async (req, res) => {
    // Multer error handler (file type / size rejections)
    // Note: multer errors are passed as the first argument to the next middleware,
    // but since we're using a single handler we catch them via the error event.
    try {
      const { userId, userType } = req.user;

      if (!req.file) {
        return sendError(res, 400, 'No file uploaded. Include a file in the "file" field.');
      }

      const { conversationId } = req.body;

      if (!conversationId || !isValidObjectId(conversationId)) {
        // Clean up uploaded file
        try { await deleteFileByName(req.file.filename); } catch (_) {}
        return sendError(res, 400, 'A valid conversationId is required');
      }

      // Verify user has access to the conversation
      const hasAccess = await validateUserAccess(conversationId, userId);
      if (!hasAccess) {
        try { await deleteFileByName(req.file.filename); } catch (_) {}
        return sendError(res, 403, 'Access denied: you are not a participant in this conversation');
      }

      // ── File rate limiting: 10 files per hour (Req 4.10) ─────────────────
      if (redisHelpers && redis) {
        try {
          const fileRateCheck = await redisHelpers.checkRateLimit(redis, userId, 'file_hourly');
          if (!fileRateCheck.allowed) {
            try { await deleteFileByName(req.file.filename); } catch (_) {}
            return sendError(
              res,
              429,
              `File upload rate limit exceeded. You can upload at most ${fileRateCheck.limit} files per hour. ` +
                `Resets in ${fileRateCheck.resetInSeconds} seconds.`
            );
          }
        } catch (_) {
          // Redis unavailable – skip rate limiting
        }
      }

      // ── Deep file validation (type + size + magic bytes) ─────────────────
      const validationResult = validateFile(req.file);
      if (!validationResult.valid) {
        try { await deleteFileByName(req.file.filename); } catch (_) {}
        return sendError(res, 400, validationResult.error);
      }

      // ── Malware scan ──────────────────────────────────────────────────────
      const scanResult = await scanForMalware(req.file);
      if (!scanResult.clean) {
        try { await deleteFileByName(req.file.filename); } catch (_) {}
        return sendError(
          res,
          400,
          `File rejected: malware detected (${scanResult.threats.join(', ')})`
        );
      }

      // ── Build file metadata ───────────────────────────────────────────────
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const fileMeta = uploadFile(req.file, {
        conversationId,
        uploadedBy: userId,
        uploaderModel: userType === 'doctor' ? 'Doctor' : 'Patient',
        baseUrl,
      });

      // ── Generate thumbnail for images ─────────────────────────────────────
      let thumbnailPath = null;
      let thumbnailUrl = null;
      try {
        const thumbResult = await generateThumbnail(req.file);
        if (thumbResult) {
          thumbnailPath = thumbResult.thumbnailPath;
          thumbnailUrl = thumbResult.thumbnailUrl;
        }
      } catch (thumbErr) {
        // Non-fatal – log and continue without thumbnail
        console.warn('[Chat.Route] Thumbnail generation failed:', thumbErr.message);
      }

      // ── Persist ChatFile record ───────────────────────────────────────────
      const uploaderModel = userType === 'doctor' ? 'Doctor' : 'Patient';
      const chatFile = await createChatFile({
        conversationId,
        uploadedBy: userId,
        uploaderModel,
        fileName: fileMeta.fileName,
        originalName: fileMeta.originalName,
        fileType: fileMeta.fileType,
        mimeType: fileMeta.mimeType,
        fileSize: fileMeta.fileSize,
        filePath: fileMeta.filePath,
        fileUrl: fileMeta.fileUrl,
        thumbnailPath: thumbnailPath || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        isScanned: true,
        scanResult: {
          clean: scanResult.clean,
          threats: scanResult.threats,
          scannedAt: scanResult.scannedAt,
        },
      });

      // ── Increment file rate-limit counter ─────────────────────────────────
      if (redisHelpers && redis) {
        try {
          await redisHelpers.incrementRateLimit(redis, userId, 'file_hourly');
        } catch (_) {}
      }

      return sendSuccess(
        res,
        {
          fileId: chatFile._id,
          fileName: chatFile.fileName,
          originalName: chatFile.originalName,
          fileType: chatFile.fileType,
          mimeType: chatFile.mimeType,
          fileSize: chatFile.fileSize,
          fileUrl: chatFile.fileUrl,
          thumbnailUrl: chatFile.thumbnailUrl || null,
          conversationId: chatFile.conversationId,
        },
        201
      );
    } catch (error) {
      // Clean up file on unexpected error
      if (req.file) {
        try { await deleteFileByName(req.file.filename); } catch (_) {}
      }
      console.error('[Chat.Route] File upload error:', error);
      const status = error.statusCode || 500;
      return sendError(res, status, error.message || 'File upload failed');
    }
  }
);

// Multer error handler for the upload route
router.use('/upload', (err, req, res, _next) => {
  if (req.file) {
    deleteFileByName(req.file.filename).catch(() => {});
  }
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, 400, 'File size exceeds the 10 MB limit');
  }
  if (err) {
    return sendError(res, 400, err.message || 'File upload error');
  }
});

/**
 * GET /api/chat/files/:id
 * Get file metadata and a signed download URL (valid 1 hour).
 * Requirements: 4.7
 */
router.get('/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid file ID format');
    }

    const file = await getFileById(id);
    if (!file) {
      return sendError(res, 404, 'File not found');
    }

    // Verify user has access to the conversation this file belongs to
    const hasAccess = await validateFileAccess(id, userId);
    if (!hasAccess) {
      return sendError(res, 403, 'Access denied: you do not have permission to access this file');
    }

    // Generate a signed URL valid for 1 hour
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const signedUrl = getSignedUrl(file.fileName, { baseUrl });

    return sendSuccess(res, {
      file: {
        _id: file._id,
        fileName: file.fileName,
        originalName: file.originalName,
        fileType: file.fileType,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
        thumbnailUrl: file.thumbnailUrl || null,
        conversationId: file.conversationId,
        uploadedBy: file.uploadedBy,
        createdAt: file.createdAt,
      },
      signedUrl,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || 'Failed to fetch file');
  }
});

/**
 * DELETE /api/chat/files/:id
 * Delete an uploaded file (uploader only).
 * Requirements: 4.10
 */
router.delete('/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid file ID format');
    }

    // deleteFileRecord verifies ownership (uploader only)
    const file = await deleteFileRecord(id, userId);

    // Remove physical file from disk
    try {
      await deleteFileByName(file.fileName);
    } catch (diskErr) {
      console.warn('[Chat.Route] Could not delete file from disk:', diskErr.message);
    }

    return sendSuccess(res, { message: 'File deleted successfully' });
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || 'Failed to delete file');
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// TASK 7.4 – Statistics Routes
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/chat/unread-count
 * Get the total unread message count across all conversations for the user.
 * Requirements: 11.6, 11.7
 */
router.get('/unread-count', async (req, res) => {
  try {
    const { userId, userType } = req.user;

    const unreadCount = await chatService.getUnreadCount(userId, userType);

    return sendSuccess(res, { unreadCount });
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || 'Failed to fetch unread count');
  }
});

/**
 * GET /api/chat/stats
 * Get chat statistics for the authenticated user.
 * Requirements: 11.6, 11.7
 */
router.get('/stats', async (req, res) => {
  try {
    const { userId, userType } = req.user;

    // Build query based on user type
    const userField = userType === 'doctor' ? 'doctorId' : 'patientId';
    const archivedField = userType === 'doctor' ? 'isArchived.doctor' : 'isArchived.patient';
    const unreadField = userType === 'doctor' ? 'unreadCount.doctor' : 'unreadCount.patient';

    const [
      totalConversations,
      activeConversations,
      emergencyConversations,
      unreadResult,
      totalFiles,
    ] = await Promise.all([
      // Total conversations
      Conversation.countDocuments({ [userField]: userId }),

      // Active (non-archived) conversations
      Conversation.countDocuments({ [userField]: userId, [archivedField]: false }),

      // Emergency conversations
      Conversation.countDocuments({ [userField]: userId, isEmergency: true }),

      // Total unread count (aggregate)
      Conversation.aggregate([
        { $match: { [userField]: new mongoose.Types.ObjectId(userId), [archivedField]: false } },
        { $group: { _id: null, total: { $sum: `$${unreadField}` } } },
      ]),

      // Total files uploaded by this user
      ChatFile.countDocuments({ uploadedBy: userId }),
    ]);

    const totalUnread = unreadResult.length > 0 ? unreadResult[0].total : 0;

    return sendSuccess(res, {
      stats: {
        totalConversations,
        activeConversations,
        archivedConversations: totalConversations - activeConversations,
        emergencyConversations,
        totalUnreadMessages: totalUnread,
        totalFilesUploaded: totalFiles,
      },
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || 'Failed to fetch statistics');
  }
});

module.exports = router;
