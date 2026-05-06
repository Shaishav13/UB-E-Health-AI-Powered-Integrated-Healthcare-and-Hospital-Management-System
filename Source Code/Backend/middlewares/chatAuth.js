
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const auditLogger = require('../services/auditLogger');
require('dotenv').config();

// Lazy-load breach notification service to avoid circular deps at startup
let breachNotificationService;
function getBreachService() {
  if (!breachNotificationService) {
    try {
      breachNotificationService = require('../services/breachNotificationService');
    } catch (_) {
      // Service unavailable — degrade gracefully
    }
  }
  return breachNotificationService;
}

// Lazy-load Redis for brute-force tracking
let redis;
function getRedis() {
  if (!redis) {
    try {
      redis = require('../configs/redis').redis;
    } catch (_) {}
  }
  return redis;
}

// Track auth failures per IP in Redis; alert if threshold exceeded
async function trackAuthFailure(ipAddress) {
  const r = getRedis();
  if (!r) return;
  try {
    const key = `auth_fail:${ipAddress}`;
    const count = await r.incr(key);
    if (count === 1) {
      // Set 15-minute window on first failure
      await r.expire(key, 15 * 60);
    }
    const svc = getBreachService();
    if (svc) {
      await svc.checkBruteForce({ ipAddress, failureCount: count });
    }
  } catch (_) {
    // Non-fatal — brute-force tracking should not block auth responses
  }
}

// Authenticate a request using the JWT in the Authorization header.
// Sets req.user on success; returns 401/403 on failure.
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    auditLogger.logAuthFailure({
      reason: 'NO_TOKEN',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      channel: 'REST',
    });
    trackAuthFailure(req.ip || req.connection.remoteAddress).catch(() => {});
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in first.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.KEY);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    // Determine user type and extract userId

    if (decoded.userType === 'doctor' && decoded.doctorID) {
      // Doctor token carries a numeric doctorId — resolve it to the MongoDB _id
      // so that all downstream services (chatService, Conversation model) can
      // use a consistent ObjectId for the userId field.
      try {
        const Doctor = mongoose.model('Doctor');
        const doctor = await Doctor.findOne({ doctorId: Number(decoded.doctorID) })
          .select('_id email')
          .lean();

        if (!doctor) {
          return res.status(403).json({
            success: false,
            message: 'Doctor account not found.',
          });
        }

        req.user = {
          userId: doctor._id.toString(), // ObjectId — works with chatService validation
          numericId: decoded.doctorID.toString(), // keep numeric id for other uses
          userType: 'doctor',
          email: decoded.email || doctor.email || '',
        };
      } catch (dbErr) {
        console.error('[chatAuth] Doctor lookup failed:', dbErr.message);
        return res.status(500).json({
          success: false,
          message: 'Authentication error. Please try again.',
        });
      }
    } else if (decoded.patientId) {
      // Patient token (no userType field in existing patient JWTs)
      req.user = {
        userId: decoded.patientId.toString(),
        userType: 'patient',
        email: decoded.email || '',
      };
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Chat is available to doctors and patients only.',
      });
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      auditLogger.logAuthFailure({
        reason: 'TOKEN_EXPIRED',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        channel: 'REST',
      });
      trackAuthFailure(req.ip || req.connection.remoteAddress).catch(() => {});
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please log in again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      auditLogger.logAuthFailure({
        reason: 'INVALID_TOKEN',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        channel: 'REST',
      });
      trackAuthFailure(req.ip || req.connection.remoteAddress).catch(() => {});
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'An error occurred during authentication.',
    });
  }
};

// Restrict a route to patients only. Must be used AFTER authenticate.
const patientOnly = (req, res, next) => {
  if (!req.user || req.user.userType !== 'patient') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This action is only available to patients.',
    });
  }
  next();
};

// Restrict a route to doctors only. Must be used AFTER authenticate.
const doctorOnly = (req, res, next) => {
  if (!req.user || req.user.userType !== 'doctor') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This action is only available to doctors.',
    });
  }
  next();
};

module.exports = { authenticate, patientOnly, doctorOnly };
