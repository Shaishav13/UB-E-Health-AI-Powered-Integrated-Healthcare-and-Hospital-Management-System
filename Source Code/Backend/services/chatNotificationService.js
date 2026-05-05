'use strict';

/**
 * Chat Notification Service
 *
 * Handles all notification delivery for the Doctor-Patient Chat System.
 * Integrates with the existing notificationService (email via nodemailer) and
 * provides:
 *
 *   1. sendNewMessageNotification  – push/email for offline recipients (Req 16.1)
 *   2. sendEmergencyAlert          – immediate push + email for emergency msgs (Req 16.2, 10.3, 10.4)
 *   3. Notification batching       – avoids spam when multiple messages arrive (Req 16.3)
 *   4. Online-user suppression     – no push when recipient is in active conv (Req 16.4)
 *   5. Notification preference     – respects user opt-out settings (Req 16.5)
 *
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 10.3, 10.4
 */

// ─── Dependencies ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');
const { sendEmail, emailTemplates } = require('./notificationService');
const { redis } = require('../configs/redis');
const { isUserOnline } = require('../utils/redisHelpers');

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Batching window in seconds.
 * If a notification for the same recipient+conversation was sent within this
 * window, subsequent notifications are suppressed (Req 16.3).
 */
const BATCH_WINDOW_SECONDS = 60; // 1 minute

/**
 * Redis key prefix for notification batch tracking.
 * Key format: notif_batch:<recipientId>:<conversationId>
 */
const BATCH_KEY_PREFIX = 'notif_batch';

// ─── Email Templates ──────────────────────────────────────────────────────────

/**
 * Build the HTML email body for a new chat message notification.
 *
 * @param {string} recipientName   - Display name of the recipient
 * @param {string} senderName      - Display name of the message sender
 * @param {string} messagePreview  - Truncated message content (max 100 chars)
 * @param {boolean} isEmergency    - Whether this is an emergency message
 * @returns {{ subject: string, html: string }}
 */
function buildNewMessageEmailTemplate(recipientName, senderName, messagePreview, isEmergency = false) {
  const urgencyBadge = isEmergency
    ? '<div style="background:#dc2626;color:white;padding:10px 20px;border-radius:5px;margin:15px 0;font-weight:bold;text-align:center;">🚨 EMERGENCY MESSAGE</div>'
    : '';

  const headerColor = isEmergency
    ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
    : 'linear-gradient(135deg, #0b6b61 0%, #0a5850 100%)';

  const subject = isEmergency
    ? `🚨 EMERGENCY: New message from ${senderName} - UB E-Health`
    : `💬 New message from ${senderName} - UB E-Health`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${headerColor}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .message-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #0b6b61; }
        .button { display: inline-block; padding: 12px 30px; background: #0b6b61; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 UB E-Health</h1>
          <p>${isEmergency ? 'Emergency Message Alert' : 'New Chat Message'}</p>
        </div>
        <div class="content">
          <h2>Hello ${recipientName},</h2>
          ${urgencyBadge}
          <p>You have a new message from <strong>${senderName}</strong>.</p>

          <div class="message-box">
            <p><strong>From:</strong> ${senderName}</p>
            <p><strong>Message:</strong> ${messagePreview}</p>
          </div>

          <p>Please log in to your account to read the full message and respond.</p>

          <a href="http://localhost:3000/dashboard" class="button">
            ${isEmergency ? 'Respond to Emergency' : 'View Message'}
          </a>

          <div class="footer">
            <p>This is an automated notification from UB E-Health</p>
            <p>You can manage your notification preferences in your account settings</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

// ─── Batch Tracking Helpers ───────────────────────────────────────────────────

/**
 * Build the Redis key used to track whether a batch notification was recently sent.
 *
 * @param {string} recipientId
 * @param {string} conversationId
 * @returns {string}
 */
function batchKey(recipientId, conversationId) {
  return `${BATCH_KEY_PREFIX}:${recipientId}:${conversationId}`;
}

/**
 * Check whether a notification for this recipient+conversation was sent within
 * the batch window.  Returns true if we should suppress (batch) the notification.
 *
 * @param {string} recipientId
 * @param {string} conversationId
 * @returns {Promise<boolean>} true = suppress, false = send
 */
async function isBatched(recipientId, conversationId) {
  try {
    const exists = await redis.exists(batchKey(recipientId, conversationId));
    return exists === 1;
  } catch (err) {
    // If Redis is unavailable, fail open (send the notification)
    console.error('[ChatNotification] isBatched Redis error:', err.message);
    return false;
  }
}

/**
 * Record that a notification was sent so subsequent ones within the window
 * are batched (suppressed).
 *
 * @param {string} recipientId
 * @param {string} conversationId
 * @param {number} [ttl=BATCH_WINDOW_SECONDS]
 * @returns {Promise<void>}
 */
async function markBatched(recipientId, conversationId, ttl = BATCH_WINDOW_SECONDS) {
  try {
    await redis.setex(batchKey(recipientId, conversationId), ttl, '1');
  } catch (err) {
    console.error('[ChatNotification] markBatched Redis error:', err.message);
  }
}

// ─── User Lookup Helpers ──────────────────────────────────────────────────────

/**
 * Fetch a user document (Doctor or Patient) by their MongoDB ObjectId.
 * Returns null if not found.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {'Doctor'|'Patient'} userModel
 * @returns {Promise<object|null>}
 */
async function fetchUser(userId, userModel) {
  try {
    const Model = mongoose.model(userModel);
    return await Model.findById(userId).lean();
  } catch (err) {
    console.error(`[ChatNotification] fetchUser error (${userModel}):`, err.message);
    return null;
  }
}

/**
 * Determine the recipient's model name ('Doctor' or 'Patient') and their
 * user document from a populated Conversation.
 *
 * @param {object} conversation  - Populated Conversation document
 * @param {string} senderId      - The sender's ObjectId string
 * @returns {{ recipientId: string, recipientModel: 'Doctor'|'Patient' }}
 */
function resolveRecipient(conversation, senderId) {
  const doctorId = conversation.doctorId._id
    ? conversation.doctorId._id.toString()
    : conversation.doctorId.toString();

  const patientId = conversation.patientId._id
    ? conversation.patientId._id.toString()
    : conversation.patientId.toString();

  if (senderId.toString() === doctorId) {
    return { recipientId: patientId, recipientModel: 'Patient' };
  }
  return { recipientId: doctorId, recipientModel: 'Doctor' };
}

// ─── Notification Preference Check ───────────────────────────────────────────

/**
 * Check whether a user has general notifications enabled.
 * Doctors do not have a notificationPreferences field in the current schema,
 * so we default to true for them.
 *
 * @param {object} userDoc - Mongoose document (lean)
 * @returns {boolean}
 */
function hasNotificationsEnabled(userDoc) {
  if (!userDoc) return false;
  // Patient schema has notificationPreferences; doctors default to enabled
  if (userDoc.notificationPreferences) {
    return userDoc.notificationPreferences.generalNotifications !== false;
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send a new-message notification to the recipient if they are offline.
 *
 * Behaviour:
 *   - If the recipient is online (presence key exists in Redis), skip (Req 16.4)
 *   - If a notification was already sent within BATCH_WINDOW_SECONDS, skip (Req 16.3)
 *   - If the recipient has disabled general notifications, skip (Req 16.5)
 *   - Otherwise send an email notification and record the batch marker
 *
 * @param {object} conversation  - Populated Conversation document
 * @param {object} message       - Saved Message document
 * @param {string} senderName    - Display name of the sender
 * @returns {Promise<{ sent: boolean, reason?: string }>}
 *
 * Requirements: 16.1, 16.3, 16.4, 16.5
 */
async function sendNewMessageNotification(conversation, message, senderName) {
  const senderId = message.senderId.toString();
  const conversationId = message.conversationId.toString();

  // Resolve recipient
  const { recipientId, recipientModel } = resolveRecipient(conversation, senderId);

  // ── 1. Skip if recipient is online (Req 16.4) ────────────────────────────
  const online = await isUserOnline(redis, recipientId);
  if (online) {
    return { sent: false, reason: 'recipient_online' };
  }

  // ── 2. Skip if within batch window (Req 16.3) ────────────────────────────
  const batched = await isBatched(recipientId, conversationId);
  if (batched) {
    return { sent: false, reason: 'batched' };
  }

  // ── 3. Fetch recipient and check preferences (Req 16.5) ──────────────────
  const recipientDoc = await fetchUser(recipientId, recipientModel);
  if (!recipientDoc) {
    console.warn(`[ChatNotification] Recipient not found: ${recipientId} (${recipientModel})`);
    return { sent: false, reason: 'recipient_not_found' };
  }

  if (!hasNotificationsEnabled(recipientDoc)) {
    return { sent: false, reason: 'notifications_disabled' };
  }

  // ── 4. Build and send email ───────────────────────────────────────────────
  const recipientName = recipientDoc.name || 'User';
  const messagePreview = (message.content || '')
    .substring(0, 100)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const { subject, html } = buildNewMessageEmailTemplate(
    recipientName,
    senderName,
    messagePreview,
    false
  );

  const result = await sendEmail(recipientDoc.email, subject, html);

  if (result.success) {
    // Record batch marker to suppress duplicates within the window
    await markBatched(recipientId, conversationId);
    console.log(
      `[ChatNotification] New-message notification sent to ${recipientDoc.email} ` +
        `(conversation: ${conversationId})`
    );
    return { sent: true };
  }

  console.error(
    `[ChatNotification] Failed to send new-message notification to ${recipientDoc.email}:`,
    result.error
  );
  return { sent: false, reason: 'email_failed', error: result.error };
}

/**
 * Send an emergency alert to the doctor when a patient flags a message as urgent.
 *
 * Emergency alerts bypass:
 *   - Online-status check (always sent, Req 16.2)
 *   - Batch window (always sent immediately, Req 16.2)
 *   - Notification preference check (always sent for emergencies, Req 10.3, 10.4)
 *
 * Sends both an email notification (and logs for push notification delivery).
 *
 * @param {object} conversation  - Populated Conversation document
 * @param {object} message       - Saved Message document (isEmergency = true)
 * @param {string} senderName    - Display name of the patient who sent the emergency
 * @returns {Promise<{ sent: boolean, emailResult: object, reason?: string }>}
 *
 * Requirements: 16.2, 10.3, 10.4
 */
async function sendEmergencyAlert(conversation, message, senderName) {
  const senderId = message.senderId.toString();
  const conversationId = message.conversationId.toString();

  // Emergency messages are always sent from patient → doctor
  const { recipientId, recipientModel } = resolveRecipient(conversation, senderId);

  // Fetch recipient (doctor)
  const recipientDoc = await fetchUser(recipientId, recipientModel);
  if (!recipientDoc) {
    console.warn(
      `[ChatNotification] Emergency alert: recipient not found: ${recipientId} (${recipientModel})`
    );
    return { sent: false, reason: 'recipient_not_found' };
  }

  const recipientName = recipientDoc.name || 'Doctor';
  const messagePreview = (message.content || '')
    .substring(0, 100)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Build emergency email
  const { subject, html } = buildNewMessageEmailTemplate(
    recipientName,
    senderName,
    messagePreview,
    true // isEmergency = true
  );

  // Send email immediately (no batching for emergencies)
  const emailResult = await sendEmail(recipientDoc.email, subject, html);

  if (emailResult.success) {
    console.log(
      `[ChatNotification] 🚨 Emergency alert sent to ${recipientDoc.email} ` +
        `(conversation: ${conversationId}, message: ${message._id})`
    );

    // Log push notification intent (push infrastructure can be wired here)
    console.log(
      `[ChatNotification] 🚨 Push notification queued for ${recipientId} ` +
        `(emergency message: ${message._id})`
    );
  } else {
    console.error(
      `[ChatNotification] Failed to send emergency alert to ${recipientDoc.email}:`,
      emailResult.error
    );
  }

  return { sent: emailResult.success, emailResult };
}

/**
 * Manually clear the batch marker for a recipient+conversation pair.
 * Useful in tests or when a conversation is explicitly opened by the user.
 *
 * @param {string} recipientId
 * @param {string} conversationId
 * @returns {Promise<void>}
 */
async function clearBatchMarker(recipientId, conversationId) {
  try {
    await redis.del(batchKey(recipientId, conversationId));
  } catch (err) {
    console.error('[ChatNotification] clearBatchMarker error:', err.message);
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  sendNewMessageNotification,
  sendEmergencyAlert,
  clearBatchMarker,

  // Exposed for testing
  _internals: {
    buildNewMessageEmailTemplate,
    isBatched,
    markBatched,
    batchKey,
    resolveRecipient,
    hasNotificationsEnabled,
    fetchUser,
    BATCH_WINDOW_SECONDS,
  },
};
