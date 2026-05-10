
const winston = require('winston');
require('winston-daily-rotate-file');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const LOG_DIR = process.env.AUDIT_LOG_DIR || path.resolve('./logs/audit');

// HMAC secret for tamper-evidence.
const HMAC_SECRET =
  process.env.AUDIT_LOG_SECRET ||
  (process.env.KEY
    ? crypto.createHash('sha256').update(`audit:${process.env.KEY}`).digest('hex')
    : 'audit-log-default-secret-change-in-production');

// Retention: 7 years = 2555 days (HIPAA)
const RETENTION_DAYS = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS, 10) || 2555;

// Compute a short HMAC-SHA256 over a log entry's deterministic fields.
// The signature covers: timestamp + category + action + actorId + targetId.
function _computeHmac(entry) {
  const payload = [
    entry.timestamp || '',
    entry.category || '',
    entry.action || '',
    entry.actorId || '',
    entry.targetId || '',
  ].join('|');

  return crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(payload)
    .digest('hex')
    .slice(0, 32); // 128-bit prefix is sufficient for tamper detection
}

const auditTransport = new winston.transports.DailyRotateFile({
  dirname: LOG_DIR,
  filename: 'audit-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,          // compress rotated files
  maxFiles: `${RETENTION_DAYS}d`, // retain for 7 years
  auditFile: path.join(LOG_DIR, '.audit-rotate-state.json'),
  createSymlink: false,
});

const auditWinston = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.json()
  ),
  transports: [auditTransport],
  exitOnError: false,
});

// Write a single audit log entry with timestamp and tamper-evidence signature.
function _writeAuditLog(entry) {
  try {
    const enriched = {
      timestamp: new Date().toISOString(),
      ...entry,
    };

    // Attach tamper-evidence signature
    enriched.sig = _computeHmac(enriched);

    auditWinston.info(enriched);
  } catch (err) {
    // Audit logging must never crash the application.
    process.stderr.write(
      `[AuditLogger] Failed to write audit log: ${err.message}\n`
    );
  }
}

// Log a message send event.
function logMessageSent(params) {
  _writeAuditLog({
    category: 'MESSAGE',
    action: 'SEND',
    actorId: params.senderId,
    targetId: params.messageId,
    details: {
      conversationId: params.conversationId,
      senderModel: params.senderModel,
      recipientId: params.recipientId,
      recipientModel: params.recipientModel,
      messageType: params.messageType || 'text',
      isEmergency: params.isEmergency || false,
      contentLength: params.contentLength || 0,
    },
  });
}

// Log a message received / delivered event.
function logMessageDelivered(params) {
  _writeAuditLog({
    category: 'MESSAGE',
    action: 'DELIVERED',
    actorId: params.recipientId,
    targetId: params.messageId,
    details: {
      conversationId: params.conversationId,
      recipientModel: params.recipientModel,
    },
  });
}

// Log a message read event.
function logMessageRead(params) {
  _writeAuditLog({
    category: 'MESSAGE',
    action: 'READ',
    actorId: params.readerId,
    targetId: params.messageId,
    details: {
      conversationId: params.conversationId,
      readerModel: params.readerModel,
    },
  });
}

// Log a file upload event.
function logFileUploaded(params) {
  _writeAuditLog({
    category: 'FILE',
    action: 'UPLOAD',
    actorId: params.uploaderId,
    targetId: params.fileId,
    details: {
      conversationId: params.conversationId,
      uploaderModel: params.uploaderModel,
      fileName: params.fileName,
      mimeType: params.mimeType,
      fileSize: params.fileSize,
      scanClean: params.scanClean,
      threats: params.threats || [],
    },
  });
}

// Log a file access (download) event.
function logFileAccessed(params) {
  _writeAuditLog({
    category: 'FILE',
    action: 'ACCESS',
    actorId: params.accessorId,
    targetId: params.fileId,
    details: {
      conversationId: params.conversationId,
      accessorModel: params.accessorModel,
    },
  });
}

// Log a file deletion event.
function logFileDeleted(params) {
  _writeAuditLog({
    category: 'FILE',
    action: 'DELETE',
    actorId: params.deleterId,
    targetId: params.fileId,
    details: {
      conversationId: params.conversationId,
      deleterModel: params.deleterModel,
      fileName: params.fileName,
    },
  });
}

// Log a conversation access event (list, open, search).
function logConversationAccess(params) {
  _writeAuditLog({
    category: 'ACCESS',
    action: params.action || 'OPEN',
    actorId: params.accessorId,
    targetId: params.conversationId,
    details: {
      accessorModel: params.accessorModel,
      ipAddress: params.ipAddress || null,
    },
  });
}

// Log a conversation creation event.
function logConversationCreated(params) {
  _writeAuditLog({
    category: 'ACCESS',
    action: 'CREATE',
    actorId: params.creatorId,
    targetId: params.conversationId,
    details: {
      creatorModel: params.creatorModel,
      doctorId: params.doctorId,
      patientId: params.patientId,
    },
  });
}

// Log an authentication failure.
function logAuthFailure(params) {
  _writeAuditLog({
    category: 'AUTH',
    action: 'FAILURE',
    actorId: params.userId || 'unknown',
    targetId: 'auth',
    details: {
      email: params.email || null,
      reason: params.reason,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      channel: params.channel || 'REST',
    },
  });
}

// Log a successful authentication event.
function logAuthSuccess(params) {
  _writeAuditLog({
    category: 'AUTH',
    action: 'SUCCESS',
    actorId: params.userId,
    targetId: 'auth',
    details: {
      userType: params.userType,
      ipAddress: params.ipAddress || null,
      channel: params.channel || 'REST',
    },
  });
}

// Log a message deletion event.
function logMessageDeleted(params) {
  _writeAuditLog({
    category: 'DELETION',
    action: 'MESSAGE_DELETE',
    actorId: params.deleterId,
    targetId: params.messageId,
    details: {
      conversationId: params.conversationId,
      deleterModel: params.deleterModel,
    },
  });
}

// Log an emergency message flagging event.
function logEmergencyFlagged(params) {
  _writeAuditLog({
    category: 'EMERGENCY',
    action: 'FLAG',
    actorId: params.patientId,
    targetId: params.messageId,
    details: {
      conversationId: params.conversationId,
    },
  });
}

// Log a rate-limit violation.
function logRateLimitViolation(params) {
  _writeAuditLog({
    category: 'SECURITY',
    action: 'RATE_LIMIT_EXCEEDED',
    actorId: params.userId,
    targetId: 'rate-limit',
    details: {
      limitType: params.limitType,
      count: params.count,
      limit: params.limit,
      ipAddress: params.ipAddress || null,
    },
  });
}

// Log a generic security event (e.g. unauthorized access attempt).
function logSecurityEvent(params) {
  _writeAuditLog({
    category: 'SECURITY',
    action: params.action,
    actorId: params.actorId || 'unknown',
    targetId: params.targetId || 'unknown',
    details: params.details || {},
  });
}

// Log a socket connection event.
function logSocketConnected(params) {
  _writeAuditLog({
    category: 'AUTH',
    action: 'SOCKET_CONNECT',
    actorId: params.userId,
    targetId: params.socketId,
    details: {
      userType: params.userType,
      ipAddress: params.ipAddress || null,
    },
  });
}

// Log a socket disconnection event.
function logSocketDisconnected(params) {
  _writeAuditLog({
    category: 'AUTH',
    action: 'SOCKET_DISCONNECT',
    actorId: params.userId,
    targetId: params.socketId,
    details: {
      userType: params.userType,
      reason: params.reason || 'unknown',
    },
  });
}

module.exports = {
  // Message events
  logMessageSent,
  logMessageDelivered,
  logMessageRead,

  // File events
  logFileUploaded,
  logFileAccessed,
  logFileDeleted,

  // Conversation access events
  logConversationAccess,
  logConversationCreated,

  // Authentication events
  logAuthFailure,
  logAuthSuccess,

  // Deletion events
  logMessageDeleted,

  // Emergency events
  logEmergencyFlagged,

  // Security events
  logRateLimitViolation,
  logSecurityEvent,

  // Socket events
  logSocketConnected,
  logSocketDisconnected,

  // Exposed for testing
  _computeHmac,
};
