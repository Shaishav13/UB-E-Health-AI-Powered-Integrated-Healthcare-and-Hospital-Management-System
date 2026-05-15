
const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const { authenticate, patientOnly } = require('../middlewares/chatAuth');
const { requireConsent } = require('../middlewares/chatConsentCheck');

const {
  getActiveConsent,
  recordConsent,
  revokeConsent,
  getConsentHistory,
} = require('../models/ChatConsent.model');

const chatService = require('../services/chatService');
const {
  chatUpload,
  uploadFile,
  getSignedUrl,
  deleteFileByName,
} = require('../services/fileStorageService');
const { validateFile, scanForMalware } = require('../services/fileValidationService');
const {
  generateThumbnail,
  generateThumbnailAsync,
  compressImage,
} = require('../services/thumbnailService');

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
const auditLogger = require('../services/auditLogger');

let redisHelpers, redis;
try {
  redisHelpers = require('../utils/redisHelpers');
  redis = require('../configs/redis').redis;
} catch (_) {
  // Redis unavailable – rate limiting will be skipped gracefully
}

// Validate that a string is a valid MongoDB ObjectId.
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Send a consistent error response.
function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ success: false, message });
}

// Send a consistent success response.
function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, ...data });
}

// Apply authentication to ALL chat routes
router.use(authenticate);

// GET /api/chat/conversations
// List all conversations for the authenticated user with pagination.
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

// GET /api/chat/conversations/:id
// Get a specific conversation with its paginated message history.
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

// POST /api/chat/conversations
// Create a new conversation between a doctor and patient.
// Validates that an active doctor-patient assignment exists.
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

    // Ensure the requesting user is one of the participants.
    // Note: for doctors, req.user.userId is the numeric doctorId (from JWT),
    // not the ObjectId. We need to look up the doctor's ObjectId first.
    const Doctor = mongoose.model('Doctor');
    const PatientModel = mongoose.model('Patient');

    let requestingUserObjectId = userId;

    if (userType === 'doctor') {
      // userId is the numeric doctorId string — resolve to ObjectId
      const requestingDoctor = await Doctor.findOne({ doctorId: Number(userId) }).lean();
      if (!requestingDoctor) {
        return sendError(res, 403, 'Requesting doctor not found');
      }
      requestingUserObjectId = requestingDoctor._id.toString();
    }

    if (requestingUserObjectId !== doctorId && requestingUserObjectId !== patientId) {
      return sendError(res, 403, 'You can only create conversations you participate in');
    }

    // Validate doctor-patient assignment:
    // Patient.docID stores the doctor's numeric doctorId, but Conversation.doctorId
    // stores the Doctor's ObjectId (_id). We need to look up the doctor by _id
    // and then check that the patient's docID matches the doctor's numeric doctorId.

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
    if (!patient.docID || Number(patient.docID) !== Number(doctor.doctorId)) {
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

    // Audit log: conversation created
    auditLogger.logConversationCreated({
      conversationId: conversation._id.toString(),
      creatorId: userId,
      creatorModel: userType === 'doctor' ? 'Doctor' : 'Patient',
      doctorId,
      patientId,
    });

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

// PUT /api/chat/conversations/:id/archive
// Archive a conversation for the authenticated user only.
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

// PUT /api/chat/conversations/:id/unarchive
// Unarchive a conversation for the authenticated user only.
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

// GET /api/chat/conversations/:id/search
// Search messages within a conversation.
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

// GET /api/chat/messages/:id
// Get a specific message by ID.
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

// DELETE /api/chat/messages/:id
// Soft-delete a message (sender only).
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

// PUT /api/chat/messages/:id/read
// Mark a message as read (recipient only).
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

// POST /api/chat/messages/:id/emergency
// Flag a message as emergency. Patients only.
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

// POST /api/chat/upload
// Upload a file attachment for a chat conversation.
// Multipart form fields: file (required), conversationId (required)
router.post(
  '/upload',
  chatUpload.single('file'),
  async (req, res) => {
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

      // File rate limiting: 10 files per hour
      if (redisHelpers && redis) {
        try {
          const fileRateCheck = await redisHelpers.checkRateLimit(redis, userId, 'file_hourly');
          if (!fileRateCheck.allowed) {
            try { await deleteFileByName(req.file.filename); } catch (_) {}
            // Audit log: file rate limit violation
            auditLogger.logRateLimitViolation({
              userId,
              limitType: 'file_hourly',
              count: fileRateCheck.count || 0,
              limit: fileRateCheck.limit || 10,
              ipAddress: req.ip,
            });
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

      // Deep file validation (type + size + magic bytes)
      const validationResult = validateFile(req.file);
      if (!validationResult.valid) {
        try { await deleteFileByName(req.file.filename); } catch (_) {}
        return sendError(res, 400, validationResult.error);
      }

      // Malware scan
      const scanResult = await scanForMalware(req.file);
      if (!scanResult.clean) {
        try { await deleteFileByName(req.file.filename); } catch (_) {}
        return sendError(
          res,
          400,
          `File rejected: malware detected (${scanResult.threats.join(', ')})`
        );
      }

      // Build file metadata
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      // Compress image before storage; non-images are skipped automatically.
      try {
        await compressImage(req.file);
        // Update file size after compression (file.size may have changed)
        const fs = require('fs');
        try {
          const stat = fs.statSync(req.file.path);
          req.file.size = stat.size;
        } catch (_) {}
      } catch (compressErr) {
        // Non-fatal – log and continue with original file
        console.warn('[Chat.Route] Image compression failed:', compressErr.message);
      }

      const fileMeta = uploadFile(req.file, {
        conversationId,
        uploadedBy: userId,
        uploaderModel: userType === 'doctor' ? 'Doctor' : 'Patient',
        baseUrl,
      });

      // Persist ChatFile record; thumbnail is generated asynchronously to keep the upload response fast.
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
        thumbnailPath: undefined,
        thumbnailUrl: undefined,
        isScanned: true,
        scanResult: {
          clean: scanResult.clean,
          threats: scanResult.threats,
          scannedAt: scanResult.scannedAt,
        },
      });

      // Generate thumbnail asynchronously (fire-and-forget).
      // The ChatFile record is updated once the thumbnail is ready.
      const { ChatFile: ChatFileModel } = require('../models/ChatFile.model');
      generateThumbnailAsync(req.file, async (thumbErr, thumbResult) => {
        if (thumbErr) {
          console.warn('[Chat.Route] Async thumbnail generation failed:', thumbErr.message);
          return;
        }
        if (thumbResult) {
          try {
            await ChatFileModel.findByIdAndUpdate(chatFile._id, {
              thumbnailPath: thumbResult.thumbnailPath,
              thumbnailUrl: thumbResult.thumbnailUrl,
            });
          } catch (updateErr) {
            console.warn('[Chat.Route] Failed to update thumbnail URL:', updateErr.message);
          }
        }
      });

      // Audit log: file uploaded
      auditLogger.logFileUploaded({
        fileId: chatFile._id.toString(),
        conversationId: conversationId.toString(),
        uploaderId: userId,
        uploaderModel: uploaderModel,
        fileName: chatFile.originalName,
        mimeType: chatFile.mimeType,
        fileSize: chatFile.fileSize,
        scanClean: scanResult.clean,
        threats: scanResult.threats || [],
      });

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

// GET /api/chat/files/:id
// Get file metadata and a signed download URL (valid 1 hour).
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

    // Audit log: file accessed
    auditLogger.logFileAccessed({
      fileId: id,
      conversationId: file.conversationId.toString(),
      accessorId: userId,
      accessorModel: req.user.userType === 'doctor' ? 'Doctor' : 'Patient',
    });

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

// DELETE /api/chat/files/:id
// Delete an uploaded file (uploader only).
router.delete('/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid file ID format');
    }

    // deleteFileRecord verifies ownership (uploader only)
    const file = await deleteFileRecord(id, userId);

    // Audit log: file deleted
    auditLogger.logFileDeleted({
      fileId: id,
      conversationId: file.conversationId ? file.conversationId.toString() : 'unknown',
      deleterId: userId,
      deleterModel: req.user.userType === 'doctor' ? 'Doctor' : 'Patient',
      fileName: file.originalName || file.fileName,
    });

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

// GET /api/chat/unread-count
// Get the total unread message count across all conversations for the user.
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

// GET /api/chat/assigned-contacts
// Returns the contacts a user is allowed to chat with based on doctor-patient assignment.
// Patient → returns their single assigned doctor; Doctor → returns all assigned patients.
router.get('/assigned-contacts', async (req, res) => {
  try {
    const { userId, userType } = req.user;

    const Doctor = mongoose.model('Doctor');
    const PatientModel = mongoose.model('Patient');

    if (userType === 'patient') {
      // Find the patient to get their assigned doctor's numeric ID
      const patient = await PatientModel.findById(userId).lean();
      if (!patient) {
        return sendError(res, 404, 'Patient not found');
      }

      let doctorNumericId = patient.docID;

      // If docID is not set, try to find the doctor via reports (pre-fix data)
      if (!doctorNumericId) {
        const { Report } = require('../models/Report.model');
        const latestReport = await Report.findOne({ patientid: userId })
          .sort({ createdAt: -1 })
          .lean();

        if (latestReport && latestReport.doctorid) {
          const reportDoctor = await Doctor.findById(latestReport.doctorid)
            .select('doctorId')
            .lean();
          if (reportDoctor) {
            doctorNumericId = reportDoctor.doctorId;
            // Backfill the docID so future lookups are fast
            await PatientModel.findByIdAndUpdate(userId, { docID: doctorNumericId });
            console.log(`✅ Backfilled docID=${doctorNumericId} for patient ${userId}`);
          }
        }
      }

      if (!doctorNumericId) {
        return sendSuccess(res, {
          contacts: [],
          message: 'You have no assigned doctor yet. Please book an appointment first.',
        });
      }

      // Look up the doctor by their numeric doctorId
      const doctor = await Doctor.findOne({ doctorId: Number(doctorNumericId) })
        .select('_id name email department profilePicture doctorId')
        .lean();

      if (!doctor) {
        return sendSuccess(res, {
          contacts: [],
          message: 'Your assigned doctor could not be found.',
        });
      }

      return sendSuccess(res, {
        contacts: [
          {
            _id: doctor._id,
            name: doctor.name,
            email: doctor.email,
            department: doctor.department,
            profilePicture: doctor.profilePicture || null,
            role: 'doctor',
          },
        ],
      });
    }

    if (userType === 'doctor') {
      // userId is the MongoDB _id (resolved in chatAuth.js), not the numeric doctorId
      const doctor = await Doctor.findById(userId).lean();
      if (!doctor) {
        return sendError(res, 404, 'Doctor not found');
      }

      // Find patients via two sources:
      //   a) Patients assigned via docID field
      //   b) Patients who have a report from this doctor (covers pre-fix data)
      const { Report } = require('../models/Report.model');

      const [assignedPatients, reportPatientIds] = await Promise.all([
        PatientModel.find({ docID: Number(doctor.doctorId) })
          .select('_id name email gender age profilePicture')
          .lean(),
        Report.find({ doctorid: doctor._id }).distinct('patientid'),
      ]);

      let reportPatients = [];
      if (reportPatientIds.length > 0) {
        reportPatients = await PatientModel.find({ _id: { $in: reportPatientIds } })
          .select('_id name email gender age profilePicture')
          .lean();
      }

      // Merge and deduplicate
      const patientMap = new Map();
      [...assignedPatients, ...reportPatients].forEach((p) => {
        patientMap.set(p._id.toString(), p);
      });
      const allPatients = Array.from(patientMap.values());

      const contacts = allPatients.map((p) => ({
        _id: p._id,
        name: p.name,
        email: p.email,
        gender: p.gender,
        age: p.age,
        profilePicture: p.profilePicture || null,
        role: 'patient',
      }));

      return sendSuccess(res, { contacts });
    }

    return sendError(res, 403, 'Only doctors and patients can access assigned contacts');
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || 'Failed to fetch assigned contacts');
  }
});

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


// Current consent agreement version. Bump this when the text changes.
const CONSENT_VERSION = '1.0';

// The canonical consent agreement text shown to patients.
const CONSENT_TEXT =
  'I consent to the use of electronic communication (chat) for the transmission ' +
  'of my protected health information (PHI) within the E-Health Management Hub. ' +
  'I understand that: (1) electronic communications may be intercepted by ' +
  'unauthorised parties; (2) the system uses industry-standard encryption to ' +
  'protect my information; (3) I may revoke this consent at any time; and ' +
  '(4) revoking consent will disable the chat feature for my account.';

router.get('/consent/status', patientOnly, async (req, res) => {
  try {
    const consent = await getActiveConsent(req.user.userId);
    return sendSuccess(res, {
      hasConsent: !!consent,
      consentVersion: consent ? consent.consentVersion : null,
      givenAt: consent ? consent.givenAt : null,
      currentVersion: CONSENT_VERSION,
      needsUpdate: consent ? consent.consentVersion !== CONSENT_VERSION : true,
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to check consent status');
  }
});

router.get('/consent/text', patientOnly, async (req, res) => {
  return sendSuccess(res, {
    version: CONSENT_VERSION,
    text: CONSENT_TEXT,
  });
});

router.post('/consent', patientOnly, async (req, res) => {
  try {
    const { agreed } = req.body;

    if (agreed !== true) {
      return sendError(res, 400, 'You must set "agreed" to true to give consent');
    }

    const ipAddress =
      req.ip ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.connection?.remoteAddress ||
      'unknown';

    const consent = await recordConsent({
      patientId: req.user.userId,
      consentVersion: CONSENT_VERSION,
      consentText: CONSENT_TEXT,
      ipAddress,
      userAgent: req.headers['user-agent'] || '',
    });

    // Audit log: consent given
    auditLogger.logSecurityEvent({
      action: 'CONSENT_GIVEN',
      actorId: req.user.userId,
      targetId: consent._id.toString(),
      details: {
        consentVersion: CONSENT_VERSION,
        ipAddress,
        userAgent: req.headers['user-agent'] || '',
      },
    });

    return sendSuccess(
      res,
      {
        message: 'Consent recorded successfully',
        consentId: consent._id,
        consentVersion: consent.consentVersion,
        givenAt: consent.givenAt,
      },
      201
    );
  } catch (error) {
    return sendError(res, 500, 'Failed to record consent');
  }
});

router.delete('/consent', patientOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const count = await revokeConsent(req.user.userId, reason);

    // Audit log: consent revoked
    auditLogger.logSecurityEvent({
      action: 'CONSENT_REVOKED',
      actorId: req.user.userId,
      targetId: req.user.userId,
      details: {
        reason: reason || 'Patient requested revocation',
        recordsUpdated: count,
        ipAddress: req.ip,
      },
    });

    return sendSuccess(res, {
      message: 'Consent revoked. You will no longer be able to use the chat system.',
      recordsUpdated: count,
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to revoke consent');
  }
});

router.get('/consent/history', patientOnly, async (req, res) => {
  try {
    const history = await getConsentHistory(req.user.userId);
    return sendSuccess(res, { history });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch consent history');
  }
});


router.post('/export', requireConsent, async (req, res) => {
  try {
    const { userId, userType } = req.user;

    // Audit log: export requested
    auditLogger.logConversationAccess({
      conversationId: 'all',
      accessorId: userId,
      accessorModel: userType === 'doctor' ? 'Doctor' : 'Patient',
      action: 'EXPORT',
      ipAddress: req.ip,
    });

    // ── Fetch all conversations for this user ─────────────────────────────
    const userField = userType === 'doctor' ? 'doctorId' : 'patientId';

    const conversations = await Conversation.find({ [userField]: userId })
      .populate('doctorId', 'name email department')
      .populate('patientId', 'name email gender age')
      .lean();

    // ── For each conversation, fetch all messages and file metadata ────────
    const { Message } = require('../models/Message.model');

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: { userId, userType },
      totalConversations: conversations.length,
      conversations: [],
    };

    for (const conv of conversations) {
      // Fetch ALL messages (including deleted) for completeness
      const messages = await Message.find({ conversationId: conv._id })
        .sort({ createdAt: 1 })
        .lean();

      // Fetch file metadata for this conversation
      const files = await ChatFile.find({ conversationId: conv._id })
        .select('-filePath -thumbnailPath') // exclude server-side paths
        .lean();

      exportData.conversations.push({
        conversationId: conv._id,
        doctor: conv.doctorId,
        patient: conv.patientId,
        createdAt: conv.createdAt,
        lastActivityAt: conv.metadata?.lastActivityAt,
        totalMessages: conv.metadata?.totalMessages || messages.length,
        isEmergency: conv.isEmergency,
        messages: messages.map((m) => ({
          messageId: m._id,
          senderId: m.senderId,
          senderModel: m.senderModel,
          content: m.isDeleted ? '[Message deleted]' : m.content,
          type: m.type,
          attachments: m.attachments || [],
          status: m.status,
          isEmergency: m.isEmergency,
          isDeleted: m.isDeleted,
          deletedAt: m.deletedAt || null,
          createdAt: m.createdAt,
        })),
        files: files.map((f) => ({
          fileId: f._id,
          originalName: f.originalName,
          fileType: f.fileType,
          mimeType: f.mimeType,
          fileSize: f.fileSize,
          uploadedBy: f.uploadedBy,
          uploaderModel: f.uploaderModel,
          createdAt: f.createdAt,
        })),
      });
    }

    // ── Stream as a JSON file download ────────────────────────────────────
    const filename = `chat-export-${userId}-${Date.now()}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Export-Generated-At', exportData.exportedAt);

    return res.status(200).json(exportData);
  } catch (error) {
    console.error('[Chat.Route] Export error:', error);
    return sendError(res, 500, 'Failed to generate chat export');
  }
});


router.post('/security/report-incident', async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const { description, severity, affectedConversationId } = req.body;

    if (!description || description.trim().length < 10) {
      return sendError(res, 400, 'Incident description must be at least 10 characters');
    }

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    const effectiveSeverity = validSeverities.includes(severity) ? severity : 'medium';

    // Validate optional conversationId
    if (affectedConversationId && !isValidObjectId(affectedConversationId)) {
      return sendError(res, 400, 'Invalid affectedConversationId format');
    }

    const incidentId = new mongoose.Types.ObjectId().toString();
    const reportedAt = new Date();

    // Audit log: security incident reported
    auditLogger.logSecurityEvent({
      action: 'SECURITY_INCIDENT_REPORTED',
      actorId: userId,
      targetId: incidentId,
      details: {
        reportedBy: { userId, userType },
        description: description.trim(),
        severity: effectiveSeverity,
        affectedConversationId: affectedConversationId || null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        reportedAt,
      },
    });

    // Send automated alert to admin via notification service
    try {
      const notificationService = require('../services/notificationService');
      if (typeof notificationService.sendAdminAlert === 'function') {
        await notificationService.sendAdminAlert({
          subject: `[HIPAA] Security Incident Reported – Severity: ${effectiveSeverity.toUpperCase()}`,
          body:
            `A security incident has been reported.\n\n` +
            `Incident ID : ${incidentId}\n` +
            `Reported by : ${userType} (${userId})\n` +
            `Severity    : ${effectiveSeverity}\n` +
            `Description : ${description.trim()}\n` +
            `Conversation: ${affectedConversationId || 'N/A'}\n` +
            `Reported at : ${reportedAt.toISOString()}\n\n` +
            `Please review the audit logs and initiate the incident response procedure.`,
        });
      }
    } catch (notifErr) {
      // Non-fatal — the incident is already logged to the audit trail
      console.warn('[Chat.Route] Failed to send admin alert:', notifErr.message);
    }

    return sendSuccess(
      res,
      {
        message: 'Security incident reported. Our team will review it promptly.',
        incidentId,
        reportedAt,
        severity: effectiveSeverity,
      },
      201
    );
  } catch (error) {
    console.error('[Chat.Route] Incident report error:', error);
    return sendError(res, 500, 'Failed to submit incident report');
  }
});


router.get('/health', async (req, res) => {
  const checks = {
    database: { status: 'unknown', latencyMs: null },
    redis: { status: 'unknown', latencyMs: null },
    socketio: { status: 'unknown', activeConnections: null },
  };

  let allHealthy = true;

  // ── 1. MongoDB ping ───────────────────────────────────────────────────────
  try {
    const mongoose = require('mongoose');
    const dbStart = Date.now();
    await mongoose.connection.db.admin().ping();
    checks.database = {
      status: 'healthy',
      latencyMs: Date.now() - dbStart,
    };
  } catch (dbErr) {
    checks.database = { status: 'unhealthy', error: dbErr.message, latencyMs: null };
    allHealthy = false;
  }

  // ── 2. Redis ping ─────────────────────────────────────────────────────────
  try {
    const { redis: redisClient } = require('../configs/redis');
    const redisStart = Date.now();
    await redisClient.ping();
    checks.redis = {
      status: 'healthy',
      latencyMs: Date.now() - redisStart,
    };
  } catch (redisErr) {
    checks.redis = { status: 'unhealthy', error: redisErr.message, latencyMs: null };
    allHealthy = false;
  }

  // ── 3. Socket.io server ───────────────────────────────────────────────────
  try {
    const io = req.app.get('io');
    if (io) {
      const sockets = await io.fetchSockets();
      checks.socketio = {
        status: 'healthy',
        activeConnections: sockets.length,
      };
    } else {
      checks.socketio = { status: 'unhealthy', error: 'Socket.io server not initialised' };
      allHealthy = false;
    }
  } catch (ioErr) {
    checks.socketio = { status: 'unhealthy', error: ioErr.message };
    allHealthy = false;
  }

  const httpStatus = allHealthy ? 200 : 503;
  return res.status(httpStatus).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    checkedAt: new Date().toISOString(),
    checks,
  });
});


router.get('/metrics', (req, res) => {
  try {
    const metricsService = require('../services/metricsService');

    if (req.query.format === 'prometheus') {
      res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      return res.status(200).send(metricsService.getPrometheusText());
    }

    return res.status(200).json(metricsService.getSnapshot());
  } catch (err) {
    return sendError(res, 500, 'Failed to collect metrics');
  }
});

module.exports = router;
