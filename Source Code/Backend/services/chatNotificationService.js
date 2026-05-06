
const mongoose = require('mongoose');
const { sendEmail, emailTemplates } = require('./notificationService');
const { redis } = require('../configs/redis');
const { isUserOnline } = require('../utils/redisHelpers');

// Batching window in seconds.
const BATCH_WINDOW_SECONDS = 60; // 1 minute

// Redis key prefix for notification batch tracking.
const BATCH_KEY_PREFIX = 'notif_batch';

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

function batchKey(recipientId, conversationId) {
  return `${BATCH_KEY_PREFIX}:${recipientId}:${conversationId}`;
}

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

async function markBatched(recipientId, conversationId, ttl = BATCH_WINDOW_SECONDS) {
  try {
    await redis.setex(batchKey(recipientId, conversationId), ttl, '1');
  } catch (err) {
    console.error('[ChatNotification] markBatched Redis error:', err.message);
  }
}

async function fetchUser(userId, userModel) {
  try {
    const Model = mongoose.model(userModel);
    return await Model.findById(userId).lean();
  } catch (err) {
    console.error(`[ChatNotification] fetchUser error (${userModel}):`, err.message);
    return null;
  }
}

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

// Check whether a user has general notifications enabled.
// Doctors do not have a notificationPreferences field in the current schema,
// so we default to true for them.
function hasNotificationsEnabled(userDoc) {
  if (!userDoc) return false;
  // Patient schema has notificationPreferences; doctors default to enabled
  if (userDoc.notificationPreferences) {
    return userDoc.notificationPreferences.generalNotifications !== false;
  }
  return true;
}

// Send a new-message notification to the recipient if they are offline.
async function sendNewMessageNotification(conversation, message, senderName) {
  const senderId = message.senderId.toString();
  const conversationId = message.conversationId.toString();

  // Resolve recipient
  const { recipientId, recipientModel } = resolveRecipient(conversation, senderId);

  // Skip if recipient is online
  const online = await isUserOnline(redis, recipientId);
  if (online) {
    return { sent: false, reason: 'recipient_online' };
  }

  // Skip if within batch window
  const batched = await isBatched(recipientId, conversationId);
  if (batched) {
    return { sent: false, reason: 'batched' };
  }

  // Fetch recipient and check preferences
  const recipientDoc = await fetchUser(recipientId, recipientModel);
  if (!recipientDoc) {
    console.warn(`[ChatNotification] Recipient not found: ${recipientId} (${recipientModel})`);
    return { sent: false, reason: 'recipient_not_found' };
  }

  if (!hasNotificationsEnabled(recipientDoc)) {
    return { sent: false, reason: 'notifications_disabled' };
  }

  // Build and send email
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

// Send an emergency alert to the doctor when a patient flags a message as urgent.
// Emergency alerts bypass online-status check, batch window, and notification preference check.
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

// Manually clear the batch marker for a recipient+conversation pair.
async function clearBatchMarker(recipientId, conversationId) {
  try {
    await redis.del(batchKey(recipientId, conversationId));
  } catch (err) {
    console.error('[ChatNotification] clearBatchMarker error:', err.message);
  }
}

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
