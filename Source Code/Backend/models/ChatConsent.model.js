'use strict';

/**
 * ChatConsent Model
 *
 * Tracks patient consent for electronic communication via the chat system.
 * HIPAA requires that patients consent to electronic communication before
 * their protected health information (PHI) is transmitted electronically.
 *
 * Each record captures:
 *   - patientId      : the patient who gave consent
 *   - consentVersion : the version of the consent agreement shown
 *   - givenAt        : timestamp when consent was recorded
 *   - ipAddress      : client IP at time of consent (for audit trail)
 *   - userAgent      : browser/client info at time of consent
 *   - isActive       : whether this consent is currently active
 *   - revokedAt      : timestamp if the patient later revoked consent
 *
 * A patient may have multiple consent records over time (e.g. if they revoke
 * and re-consent, or if the consent agreement is updated). The most recent
 * active record is the authoritative one.
 *
 * Requirements: 22.3
 */

const mongoose = require('mongoose');

const chatConsentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    consentVersion: {
      type: String,
      required: true,
      default: '1.0',
    },
    consentText: {
      type: String,
      required: true,
    },
    givenAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index: quickly find the active consent for a patient
chatConsentSchema.index({ patientId: 1, isActive: 1 });

// Index for audit queries by date range
chatConsentSchema.index({ givenAt: -1 });

const ChatConsent = mongoose.model('ChatConsent', chatConsentSchema);

// ─── Helper functions ─────────────────────────────────────────────────────────

/**
 * Check whether a patient has an active consent record.
 *
 * @param {string} patientId - MongoDB ObjectId of the patient
 * @returns {Promise<ChatConsent|null>} The active consent record, or null
 */
async function getActiveConsent(patientId) {
  return ChatConsent.findOne({ patientId, isActive: true })
    .sort({ givenAt: -1 })
    .lean();
}

/**
 * Record a new consent from a patient.
 *
 * Any previously active consent records for this patient are deactivated
 * before the new one is saved (handles re-consent after version update).
 *
 * @param {object} params
 * @param {string} params.patientId
 * @param {string} params.consentVersion
 * @param {string} params.consentText
 * @param {string} params.ipAddress
 * @param {string} [params.userAgent]
 * @returns {Promise<ChatConsent>} The newly created consent record
 */
async function recordConsent({ patientId, consentVersion, consentText, ipAddress, userAgent }) {
  // Deactivate any existing active consents for this patient
  await ChatConsent.updateMany(
    { patientId, isActive: true },
    { $set: { isActive: false } }
  );

  const consent = new ChatConsent({
    patientId,
    consentVersion,
    consentText,
    givenAt: new Date(),
    ipAddress,
    userAgent: userAgent || '',
    isActive: true,
  });

  return consent.save();
}

/**
 * Revoke a patient's active consent.
 *
 * @param {string} patientId
 * @param {string} [reason]
 * @returns {Promise<number>} Number of records updated
 */
async function revokeConsent(patientId, reason) {
  const result = await ChatConsent.updateMany(
    { patientId, isActive: true },
    {
      $set: {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: reason || 'Patient requested revocation',
      },
    }
  );
  return result.modifiedCount;
}

/**
 * Get the full consent history for a patient (for audit purposes).
 *
 * @param {string} patientId
 * @returns {Promise<ChatConsent[]>}
 */
async function getConsentHistory(patientId) {
  return ChatConsent.find({ patientId }).sort({ givenAt: -1 }).lean();
}

module.exports = {
  ChatConsent,
  getActiveConsent,
  recordConsent,
  revokeConsent,
  getConsentHistory,
};
