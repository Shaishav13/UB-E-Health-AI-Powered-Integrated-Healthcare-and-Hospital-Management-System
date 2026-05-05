'use strict';

/**
 * Chat Consent Check Middleware
 *
 * Enforces that patients have given consent to electronic communication
 * before they can send messages or access chat features.
 *
 * Doctors are exempt — consent is a patient-side HIPAA requirement.
 *
 * Usage:
 *   Apply after `authenticate` on routes that involve PHI transmission.
 *   The middleware is intentionally lightweight: it only checks for an
 *   active consent record and returns 403 if none exists.
 *
 * Requirements: 22.3
 */

const { getActiveConsent } = require('../models/ChatConsent.model');
const auditLogger = require('../services/auditLogger');

/**
 * Middleware: require active patient consent before proceeding.
 *
 * - Doctors pass through unconditionally.
 * - Patients without an active consent record receive a 403 with a
 *   `consentRequired: true` flag so the frontend can show the consent dialog.
 *
 * Must be used AFTER the `authenticate` middleware.
 */
const requireConsent = async (req, res, next) => {
  // Doctors are not subject to patient consent requirements
  if (!req.user || req.user.userType !== 'patient') {
    return next();
  }

  try {
    const consent = await getActiveConsent(req.user.userId);

    if (!consent) {
      // Audit log: consent missing (Req 22.3)
      auditLogger.logSecurityEvent({
        action: 'CONSENT_MISSING',
        actorId: req.user.userId,
        targetId: req.path,
        details: {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          reason: 'Patient attempted to access chat without active consent',
        },
      });

      return res.status(403).json({
        success: false,
        consentRequired: true,
        message:
          'You must agree to the electronic communication consent before using the chat system.',
      });
    }

    // Attach consent info to request for downstream use
    req.patientConsent = consent;
    return next();
  } catch (err) {
    console.error('[ConsentCheck] Error checking consent:', err.message);
    // Fail open on unexpected errors to avoid blocking legitimate users
    return next();
  }
};

module.exports = { requireConsent };
