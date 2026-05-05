'use strict';

/**
 * Breach Notification Service
 *
 * Implements automated security event detection and HIPAA breach notification
 * procedures for the Doctor-Patient Chat System.
 *
 * HIPAA Breach Notification Rule (45 CFR §§ 164.400-414) requires:
 *   - Notification to affected individuals within 60 days of discovery
 *   - Notification to the Secretary of HHS
 *   - Notification to prominent media outlets if breach affects 500+ individuals
 *     in a state or jurisdiction
 *
 * This service handles:
 *   1. Automated detection of suspicious security events from the audit log
 *   2. Incident creation and tracking
 *   3. Automated alerts to system administrators
 *   4. Structured incident records for regulatory reporting
 *
 * Requirements: 22.4
 */

const mongoose = require('mongoose');
const auditLogger = require('./auditLogger');

// ─── Incident severity levels ─────────────────────────────────────────────────

const SEVERITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
});

// ─── Security event thresholds ────────────────────────────────────────────────

/**
 * Number of authentication failures from the same IP within 15 minutes
 * that triggers a brute-force alert.
 */
const AUTH_FAILURE_THRESHOLD = 10;

/**
 * Number of rate-limit violations from the same user within 1 hour
 * that triggers a spam/abuse alert.
 */
const RATE_LIMIT_VIOLATION_THRESHOLD = 5;

// ─── In-memory incident tracker ───────────────────────────────────────────────
// In production this would be persisted to a dedicated Incidents collection.
// For this implementation we use an in-memory map keyed by incidentId.

const _incidents = new Map();

// ─── Core functions ───────────────────────────────────────────────────────────

/**
 * Create a new security incident record.
 *
 * @param {object} params
 * @param {string} params.type          - Incident type (e.g. 'BRUTE_FORCE', 'UNAUTHORISED_ACCESS')
 * @param {string} params.severity      - One of SEVERITY values
 * @param {string} params.description   - Human-readable description
 * @param {object} params.details       - Additional context
 * @param {string} [params.reportedBy]  - userId of the reporter (or 'system')
 * @returns {{ incidentId: string, incident: object }}
 */
function createIncident({ type, severity, description, details, reportedBy = 'system' }) {
  const incidentId = new mongoose.Types.ObjectId().toString();
  const incident = {
    incidentId,
    type,
    severity,
    description,
    details,
    reportedBy,
    status: 'open',
    createdAt: new Date(),
    updatedAt: new Date(),
    notificationsSent: [],
  };

  _incidents.set(incidentId, incident);

  // Audit log: incident created (Req 22.4, 19.8)
  auditLogger.logSecurityEvent({
    action: 'INCIDENT_CREATED',
    actorId: reportedBy,
    targetId: incidentId,
    details: {
      type,
      severity,
      description,
      ...details,
    },
  });

  return { incidentId, incident };
}

/**
 * Update the status of an existing incident.
 *
 * @param {string} incidentId
 * @param {'open'|'investigating'|'contained'|'resolved'} status
 * @param {string} [notes]
 * @returns {object|null} Updated incident or null if not found
 */
function updateIncidentStatus(incidentId, status, notes) {
  const incident = _incidents.get(incidentId);
  if (!incident) return null;

  incident.status = status;
  incident.updatedAt = new Date();
  if (notes) {
    incident.notes = (incident.notes || '') + `\n[${new Date().toISOString()}] ${notes}`;
  }

  auditLogger.logSecurityEvent({
    action: 'INCIDENT_STATUS_UPDATED',
    actorId: 'system',
    targetId: incidentId,
    details: { status, notes },
  });

  return incident;
}

/**
 * Get an incident by ID.
 *
 * @param {string} incidentId
 * @returns {object|null}
 */
function getIncident(incidentId) {
  return _incidents.get(incidentId) || null;
}

/**
 * Get all open incidents.
 *
 * @returns {object[]}
 */
function getOpenIncidents() {
  return Array.from(_incidents.values()).filter((i) => i.status === 'open');
}

// ─── Automated alert functions ────────────────────────────────────────────────

/**
 * Send an automated alert to the system administrator.
 *
 * Uses the existing notification service if available; falls back to
 * console logging so the alert is never silently dropped.
 *
 * @param {object} incident
 * @returns {Promise<void>}
 */
async function sendAdminAlert(incident) {
  const subject = `[HIPAA ALERT] ${incident.severity.toUpperCase()} – ${incident.type}`;
  const body =
    `A security incident has been detected.\n\n` +
    `Incident ID : ${incident.incidentId}\n` +
    `Type        : ${incident.type}\n` +
    `Severity    : ${incident.severity}\n` +
    `Status      : ${incident.status}\n` +
    `Description : ${incident.description}\n` +
    `Detected at : ${incident.createdAt.toISOString()}\n\n` +
    `Details:\n${JSON.stringify(incident.details, null, 2)}\n\n` +
    `Please review the audit logs and follow the incident response playbook:\n` +
    `  docs/HIPAA_INCIDENT_RESPONSE_PLAYBOOK.md`;

  // Try the existing notification service
  try {
    const notificationService = require('./notificationService');
    if (typeof notificationService.sendAdminAlert === 'function') {
      await notificationService.sendAdminAlert({ subject, body });
      incident.notificationsSent.push({ channel: 'email', sentAt: new Date() });
      return;
    }
  } catch (_) {
    // Notification service unavailable — fall through to console
  }

  // Fallback: write to stderr so it appears in server logs
  process.stderr.write(
    `\n[BREACH NOTIFICATION SERVICE] ${subject}\n${body}\n\n`
  );
  incident.notificationsSent.push({ channel: 'stderr', sentAt: new Date() });
}

// ─── Automated security event monitors ───────────────────────────────────────

/**
 * Check for brute-force authentication attempts.
 *
 * Call this from the auth failure handler. If the failure count for an IP
 * exceeds the threshold, an incident is created and an alert is sent.
 *
 * @param {object} params
 * @param {string} params.ipAddress
 * @param {string} [params.userId]
 * @param {string} [params.reason]
 * @param {number} params.failureCount - Current failure count for this IP
 * @returns {Promise<void>}
 */
async function checkBruteForce({ ipAddress, userId, reason, failureCount }) {
  if (failureCount < AUTH_FAILURE_THRESHOLD) return;

  const { incidentId, incident } = createIncident({
    type: 'BRUTE_FORCE_ATTEMPT',
    severity: SEVERITY.HIGH,
    description: `${failureCount} authentication failures detected from IP ${ipAddress}`,
    details: { ipAddress, userId: userId || 'unknown', reason, failureCount },
  });

  await sendAdminAlert(incident);
}

/**
 * Check for repeated rate-limit violations (potential spam/abuse).
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.limitType
 * @param {number} params.violationCount
 * @returns {Promise<void>}
 */
async function checkRateLimitAbuse({ userId, limitType, violationCount }) {
  if (violationCount < RATE_LIMIT_VIOLATION_THRESHOLD) return;

  const { incident } = createIncident({
    type: 'RATE_LIMIT_ABUSE',
    severity: SEVERITY.MEDIUM,
    description: `User ${userId} has exceeded rate limits ${violationCount} times for ${limitType}`,
    details: { userId, limitType, violationCount },
  });

  await sendAdminAlert(incident);
}

/**
 * Report an unauthorised access attempt.
 *
 * Call this when a user attempts to access a conversation or resource they
 * are not authorised for.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.userType
 * @param {string} params.resourceId
 * @param {string} params.resourceType
 * @param {string} [params.ipAddress]
 * @returns {Promise<void>}
 */
async function reportUnauthorisedAccess({ userId, userType, resourceId, resourceType, ipAddress }) {
  const { incident } = createIncident({
    type: 'UNAUTHORISED_ACCESS_ATTEMPT',
    severity: SEVERITY.HIGH,
    description: `${userType} ${userId} attempted to access ${resourceType} ${resourceId} without authorisation`,
    details: { userId, userType, resourceId, resourceType, ipAddress },
  });

  await sendAdminAlert(incident);
}

/**
 * Report a potential data breach.
 *
 * Use this for high-severity events such as bulk data access, unexpected
 * exports, or confirmed unauthorised access to PHI.
 *
 * @param {object} params
 * @param {string} params.description
 * @param {object} params.details
 * @param {string} [params.reportedBy]
 * @returns {Promise<{ incidentId: string }>}
 */
async function reportPotentialBreach({ description, details, reportedBy = 'system' }) {
  const { incidentId, incident } = createIncident({
    type: 'POTENTIAL_DATA_BREACH',
    severity: SEVERITY.CRITICAL,
    description,
    details,
    reportedBy,
  });

  await sendAdminAlert(incident);

  // Audit log with CRITICAL severity (Req 22.4)
  auditLogger.logSecurityEvent({
    action: 'POTENTIAL_BREACH_REPORTED',
    actorId: reportedBy,
    targetId: incidentId,
    details: {
      description,
      severity: SEVERITY.CRITICAL,
      ...details,
    },
  });

  return { incidentId };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  SEVERITY,
  createIncident,
  updateIncidentStatus,
  getIncident,
  getOpenIncidents,
  sendAdminAlert,
  checkBruteForce,
  checkRateLimitAbuse,
  reportUnauthorisedAccess,
  reportPotentialBreach,
};
