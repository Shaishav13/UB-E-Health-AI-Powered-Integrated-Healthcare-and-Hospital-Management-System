'use strict';

/**
 * Data Retention Service
 *
 * HIPAA-compliant data retention for the Doctor-Patient Chat System.
 *
 * Policy (Requirements 19.6, 22.2):
 *   - Conversations and messages must be retained for a minimum of 7 years.
 *   - After 7 years, conversations are automatically archived (soft-archived)
 *     rather than deleted, preserving the data for audit purposes.
 *   - Audit logs are retained for 7 years via the auditLogger's DailyRotateFile
 *     transport (configured in auditLogger.js with maxFiles: '2555d').
 *   - Physical file attachments older than 7 years are flagged for review but
 *     NOT automatically deleted — a human operator must confirm deletion.
 *
 * Archiving strategy:
 *   - Conversations whose `metadata.lastActivityAt` is older than 7 years are
 *     marked as archived for BOTH doctor and patient (isArchived.doctor = true,
 *     isArchived.patient = true) and tagged with `retentionArchived: true`.
 *   - This keeps them out of active conversation lists while preserving all data.
 *
 * Scheduled execution:
 *   - The `scheduleRetentionJob()` function registers a daily cron job (runs at
 *     02:00 server time) using node-cron.
 *   - Call `runRetentionCheck()` directly for manual / on-demand execution.
 *
 * Requirements: 19.6, 22.2
 */

const cron = require('node-cron');
const mongoose = require('mongoose');
const auditLogger = require('./auditLogger');

// ─── Constants ────────────────────────────────────────────────────────────────

/** 7 years in milliseconds */
const SEVEN_YEARS_MS = 7 * 365.25 * 24 * 60 * 60 * 1000;

/** Batch size for processing conversations to avoid memory pressure */
const BATCH_SIZE = 100;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the Date that is exactly 7 years ago from now.
 * @returns {Date}
 */
function getRetentionCutoffDate() {
  return new Date(Date.now() - SEVEN_YEARS_MS);
}

// ─── Core retention logic ─────────────────────────────────────────────────────

/**
 * Archive conversations that have been inactive for 7+ years.
 *
 * Marks both `isArchived.doctor` and `isArchived.patient` as true and sets a
 * `retentionArchived` flag so the system can distinguish user-initiated archives
 * from retention-driven archives.
 *
 * @returns {Promise<{archivedCount: number, cutoffDate: Date}>}
 */
async function archiveOldConversations() {
  const { Conversation } = require('../models/Conversation.model');
  const cutoffDate = getRetentionCutoffDate();

  let archivedCount = 0;
  let lastId = null;

  // Process in batches to avoid loading all documents into memory at once
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = {
      'metadata.lastActivityAt': { $lt: cutoffDate },
      retentionArchived: { $ne: true }, // skip already-archived ones
    };

    if (lastId) {
      query._id = { $gt: lastId };
    }

    const batch = await Conversation.find(query)
      .select('_id doctorId patientId metadata.lastActivityAt')
      .sort({ _id: 1 })
      .limit(BATCH_SIZE)
      .lean();

    if (batch.length === 0) break;

    const ids = batch.map((c) => c._id);

    await Conversation.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          'isArchived.doctor': true,
          'isArchived.patient': true,
          retentionArchived: true,
          retentionArchivedAt: new Date(),
        },
      }
    );

    archivedCount += batch.length;
    lastId = batch[batch.length - 1]._id;

    // Audit log each batch (Req 19.6)
    for (const conv of batch) {
      auditLogger.logSecurityEvent({
        action: 'RETENTION_ARCHIVE',
        actorId: 'system',
        targetId: conv._id.toString(),
        details: {
          doctorId: conv.doctorId?.toString(),
          patientId: conv.patientId?.toString(),
          lastActivityAt: conv.metadata?.lastActivityAt,
          cutoffDate,
          reason: 'Conversation inactive for 7+ years (HIPAA retention policy)',
        },
      });
    }

    // If we got fewer than BATCH_SIZE, we've processed all matching documents
    if (batch.length < BATCH_SIZE) break;
  }

  return { archivedCount, cutoffDate };
}

/**
 * Identify ChatFile records older than 7 years and flag them for operator review.
 *
 * Files are NOT automatically deleted — a human operator must confirm deletion
 * to prevent accidental loss of medical records.
 *
 * @returns {Promise<{flaggedCount: number, cutoffDate: Date}>}
 */
async function flagOldFilesForReview() {
  const { ChatFile } = require('../models/ChatFile.model');
  const cutoffDate = getRetentionCutoffDate();

  let flaggedCount = 0;
  let lastId = null;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = {
      createdAt: { $lt: cutoffDate },
      retentionFlagged: { $ne: true },
    };

    if (lastId) {
      query._id = { $gt: lastId };
    }

    const batch = await ChatFile.find(query)
      .select('_id conversationId fileName fileSize createdAt')
      .sort({ _id: 1 })
      .limit(BATCH_SIZE)
      .lean();

    if (batch.length === 0) break;

    const ids = batch.map((f) => f._id);

    await ChatFile.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          retentionFlagged: true,
          retentionFlaggedAt: new Date(),
        },
      }
    );

    flaggedCount += batch.length;
    lastId = batch[batch.length - 1]._id;

    // Audit log the flagging (Req 19.2, 19.6)
    for (const file of batch) {
      auditLogger.logSecurityEvent({
        action: 'RETENTION_FILE_FLAGGED',
        actorId: 'system',
        targetId: file._id.toString(),
        details: {
          conversationId: file.conversationId?.toString(),
          fileName: file.fileName,
          fileSize: file.fileSize,
          createdAt: file.createdAt,
          cutoffDate,
          reason: 'File older than 7 years — flagged for operator review',
        },
      });
    }

    if (batch.length < BATCH_SIZE) break;
  }

  return { flaggedCount, cutoffDate };
}

/**
 * Run the full retention check:
 *   1. Archive old conversations
 *   2. Flag old files for review
 *
 * @returns {Promise<{conversations: object, files: object, ranAt: Date}>}
 */
async function runRetentionCheck() {
  const ranAt = new Date();

  console.log('[DataRetention] Starting retention check at', ranAt.toISOString());

  const [conversationResult, fileResult] = await Promise.allSettled([
    archiveOldConversations(),
    flagOldFilesForReview(),
  ]);

  const convSummary =
    conversationResult.status === 'fulfilled'
      ? conversationResult.value
      : { error: conversationResult.reason?.message };

  const fileSummary =
    fileResult.status === 'fulfilled'
      ? fileResult.value
      : { error: fileResult.reason?.message };

  const summary = {
    conversations: convSummary,
    files: fileSummary,
    ranAt,
  };

  console.log('[DataRetention] Retention check complete:', JSON.stringify(summary));

  // Audit log the retention run (Req 19.6)
  auditLogger.logSecurityEvent({
    action: 'RETENTION_CHECK_COMPLETE',
    actorId: 'system',
    targetId: 'retention-job',
    details: summary,
  });

  return summary;
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

/**
 * Register a daily cron job that runs the retention check at 02:00 server time.
 *
 * Call this once during server startup (e.g. in Backend/index.js).
 *
 * Requirements: 19.6, 22.2
 */
function scheduleRetentionJob() {
  // Run at 02:00 every day
  cron.schedule('0 2 * * *', async () => {
    try {
      await runRetentionCheck();
    } catch (err) {
      console.error('[DataRetention] Retention job failed:', err.message);
      auditLogger.logSecurityEvent({
        action: 'RETENTION_JOB_ERROR',
        actorId: 'system',
        targetId: 'retention-job',
        details: { error: err.message, stack: err.stack },
      });
    }
  });

  console.log('[DataRetention] Daily retention job scheduled (runs at 02:00).');
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  runRetentionCheck,
  archiveOldConversations,
  flagOldFilesForReview,
  scheduleRetentionJob,
  getRetentionCutoffDate,
  SEVEN_YEARS_MS,
};
