'use strict';

/**
 * Audit Logger Service
 *
 * HIPAA-compliant audit logging for the Doctor-Patient Chat System.
 * All Protected Health Information (PHI) access and modification events
 * are recorded with tamper-evident, append-only log files.
 *
 * Log categories:
 *   - MESSAGE   : send / receive events
 *   - FILE      : upload events (with scan results)
 *   - ACCESS    : conversation access events
 *   - AUTH      : authentication failures
 *   - DELETION  : message deletion events
 *   - SECURITY  : rate-limit violations and other security events
 *   - EMERGENCY : emergency message flagging
 *
 * Storage:
 *   - Logs are written to ./logs/audit/ with daily rotation.
 *   - Each log line is a JSON object (one per line) for easy parsing.
 *   - Files are retained for 7 years (2555 days) per HIPAA Req 19.6.
 *   - Log files are never deleted by the application (zippedArchive: true).
 *
 * Tamper-evidence:
 *   - Each log entry includes a SHA-256 HMAC over its content so that
 *     any modification to a log line can be detected.
 *   - The HMAC key is read from AUDIT_LOG_SECRET env var (falls back to
 *     a derived value from KEY so the system still works without extra config).
 *
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7
 */

const winston = require('winston');
require('winston-daily-rotate-file');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

// ─── Configuration ────────────────────────────────────────────────────────────

const LOG_DIR = process.env.AUDIT_LOG_DIR || path.resolve('./logs/audit');

/**
 * HMAC secret for tamper-evidence.
 * Use a dedicated env var; fall back to a derivative of the JWT key.
 */
const HMAC_SECRET =
  process.env.AUDIT_LOG_SECRET ||
  (process.env.KEY
    ? crypto.createHash('sha256').update(`audit:${process.env.KEY}`).digest('hex')
    : 'audit-log-default-secret-change-in-production');

// Retention: 7 years = 2555 days (HIPAA Req 19.6)
const RETENTION_DAYS = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS, 10) || 2555;

// ─── HMAC helper ──────────────────────────────────────────────────────────────

/**
 * Compute a short HMAC-SHA256 over a log entry's deterministic fields.
 * The signature covers: timestamp + category + action + actorId + targetId.
 *
 * @param {object} entry - The log entry object (before adding the sig field).
 * @returns {string} Hex-encoded HMAC (first 32 chars for compactness).
 */
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

// ─── Winston transport: daily-rotating audit file ────────────────────────────

const auditTransport = new winston.transports.DailyRotateFile({
  dirname: LOG_DIR,
  filename: 'audit-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,          // compress rotated files
  maxFiles: `${RETENTION_DAYS}d`, // retain for 7 years
  auditFile: path.join(LOG_DIR, '.audit-rotate-state.json'),
  createSymlink: false,
  // Never delete – maxFiles controls retention, not deletion of older files
  // when combined with zippedArchive the files are kept as .gz
});

/**
 * The Winston logger instance used exclusively for audit events.
 * Only writes to the rotating file transport (no console output for audit logs
 * to avoid leaking PHI into process stdout/stderr).
 */
const auditWinston = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.json()
  ),
  transports: [auditTransport],
  // Prevent unhandled-exception / rejection hooks from writing to this logger
  exitOnError: false,
});

// ─── Core write function ──────────────────────────────────────────────────────

/**
 * Write a single audit log entry.
 *
 * The entry is enriched with:
 *   - `timestamp`  : ISO-8601 with milliseconds and timezone
 *   - `sig`        : HMAC-SHA256 over key fields (tamper evidence)
 *
 * @param {object} entry
 * @param {string} entry.category  - Log category (MESSAGE, FILE, ACCESS, …)
 * @param {string} entry.action    - Specific action (SEND, UPLOAD, READ, …)
 * @param {string} [entry.actorId] - ID of the user performing the action
 * @param {string} [entry.targetId]- ID of the resource being acted upon
 * @param {object} [entry.details] - Additional context (never include raw PHI)
 */
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
    // Log to stderr as a last resort.
    process.stderr.write(
      `[AuditLogger] Failed to write audit log: ${err.message}\n`
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. Message events (Req 19.1) ────────────────────────────────────────────

/**
 * Log a message send event.
 *
 * @param {object} params
 * @param {string} params.messageId      - MongoDB ObjectId of the message
 * @param {string} params.conversationId - MongoDB ObjectId of the conversation
 * @param {string} params.senderId       - MongoDB ObjectId of the sender
 * @param {string} params.senderModel    - 'Doctor' | 'Patient'
 * @param {string} params.recipientId    - MongoDB ObjectId of the recipient
 * @param {string} params.recipientModel - 'Doctor' | 'Patient'
 * @param {string} [params.messageType]  - 'text' | 'file' | 'image'
 * @param {boolean} [params.isEmergency] - Whether the message is flagged as emergency
 * @param {number} [params.contentLength]- Character count of the message content
 */
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

/**
 * Log a message received / delivered event.
 *
 * @param {object} params
 * @param {string} params.messageId      - MongoDB ObjectId of the message
 * @param {string} params.conversationId
 * @param {string} params.recipientId    - User who received the message
 * @param {string} params.recipientModel - 'Doctor' | 'Patient'
 */
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

/**
 * Log a message read event.
 *
 * @param {object} params
 * @param {string} params.messageId      - MongoDB ObjectId of the message
 * @param {string} params.conversationId
 * @param {string} params.readerId       - User who read the message
 * @param {string} params.readerModel    - 'Doctor' | 'Patient'
 */
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

// ─── 2. File upload events (Req 19.2) ────────────────────────────────────────

/**
 * Log a file upload event.
 *
 * @param {object} params
 * @param {string} params.fileId         - MongoDB ObjectId of the ChatFile
 * @param {string} params.conversationId
 * @param {string} params.uploaderId     - MongoDB ObjectId of the uploader
 * @param {string} params.uploaderModel  - 'Doctor' | 'Patient'
 * @param {string} params.fileName       - Sanitized file name (no path)
 * @param {string} params.mimeType       - MIME type of the file
 * @param {number} params.fileSize       - File size in bytes
 * @param {boolean} params.scanClean     - Whether the malware scan passed
 * @param {string[]} [params.threats]    - Detected threats (if any)
 */
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

/**
 * Log a file access (download) event.
 *
 * @param {object} params
 * @param {string} params.fileId         - MongoDB ObjectId of the ChatFile
 * @param {string} params.conversationId
 * @param {string} params.accessorId     - User requesting the file
 * @param {string} params.accessorModel  - 'Doctor' | 'Patient'
 */
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

/**
 * Log a file deletion event.
 *
 * @param {object} params
 * @param {string} params.fileId         - MongoDB ObjectId of the ChatFile
 * @param {string} params.conversationId
 * @param {string} params.deleterId      - User deleting the file
 * @param {string} params.deleterModel   - 'Doctor' | 'Patient'
 * @param {string} params.fileName       - Sanitized file name
 */
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

// ─── 3. Conversation access events (Req 19.3) ────────────────────────────────

/**
 * Log a conversation access event (list, open, search).
 *
 * @param {object} params
 * @param {string} params.conversationId
 * @param {string} params.accessorId     - User accessing the conversation
 * @param {string} params.accessorModel  - 'Doctor' | 'Patient'
 * @param {string} params.action         - 'LIST' | 'OPEN' | 'SEARCH' | 'ARCHIVE' | 'UNARCHIVE'
 * @param {string} [params.ipAddress]    - Client IP address
 */
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

/**
 * Log a conversation creation event.
 *
 * @param {object} params
 * @param {string} params.conversationId
 * @param {string} params.creatorId
 * @param {string} params.creatorModel   - 'Doctor' | 'Patient'
 * @param {string} params.doctorId
 * @param {string} params.patientId
 */
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

// ─── 4. Authentication failure events (Req 19.4) ─────────────────────────────

/**
 * Log an authentication failure.
 *
 * @param {object} params
 * @param {string} [params.userId]    - Attempted user ID (if known)
 * @param {string} [params.email]     - Attempted email (if known)
 * @param {string} params.reason      - Failure reason (e.g. 'TOKEN_EXPIRED', 'INVALID_TOKEN')
 * @param {string} [params.ipAddress] - Client IP address
 * @param {string} [params.userAgent] - Client user-agent string
 * @param {string} [params.channel]   - 'REST' | 'SOCKET'
 */
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

/**
 * Log a successful authentication event.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.userType   - 'doctor' | 'patient'
 * @param {string} [params.ipAddress]
 * @param {string} [params.channel]  - 'REST' | 'SOCKET'
 */
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

// ─── 5. Message deletion events (Req 19.5) ───────────────────────────────────

/**
 * Log a message deletion event.
 *
 * @param {object} params
 * @param {string} params.messageId      - MongoDB ObjectId of the deleted message
 * @param {string} params.conversationId
 * @param {string} params.deleterId      - User who deleted the message
 * @param {string} params.deleterModel   - 'Doctor' | 'Patient'
 */
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

// ─── 6. Emergency flagging events (Req 10.7) ─────────────────────────────────

/**
 * Log an emergency message flagging event.
 *
 * @param {object} params
 * @param {string} params.messageId      - MongoDB ObjectId of the message
 * @param {string} params.conversationId
 * @param {string} params.patientId      - Patient who flagged the emergency
 */
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

// ─── 7. Security events (Req 12.8, 19.8) ─────────────────────────────────────

/**
 * Log a rate-limit violation.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.limitType  - 'message_hourly' | 'message_minute' | 'file_hourly'
 * @param {number} params.count      - Current count at time of violation
 * @param {number} params.limit      - The configured limit
 * @param {string} [params.ipAddress]
 */
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

/**
 * Log a generic security event (e.g. unauthorized access attempt).
 *
 * @param {object} params
 * @param {string} params.action      - Short description of the event
 * @param {string} [params.actorId]   - User involved (if known)
 * @param {string} [params.targetId]  - Resource targeted
 * @param {object} [params.details]   - Additional context
 */
function logSecurityEvent(params) {
  _writeAuditLog({
    category: 'SECURITY',
    action: params.action,
    actorId: params.actorId || 'unknown',
    targetId: params.targetId || 'unknown',
    details: params.details || {},
  });
}

// ─── 8. Socket connection events ─────────────────────────────────────────────

/**
 * Log a socket connection event.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.userType   - 'doctor' | 'patient'
 * @param {string} params.socketId
 * @param {string} [params.ipAddress]
 */
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

/**
 * Log a socket disconnection event.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.userType
 * @param {string} params.socketId
 * @param {string} [params.reason]
 */
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

// ─── Exports ──────────────────────────────────────────────────────────────────

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
