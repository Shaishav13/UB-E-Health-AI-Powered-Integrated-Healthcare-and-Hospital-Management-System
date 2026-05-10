
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const jwt = require('jsonwebtoken');
const { redis } = require('../configs/redis');
const { registerSocketHandlers } = require('./socketHandlers');
const auditLogger = require('../services/auditLogger');

// Maximum concurrent socket connections allowed per user
const MAX_CONNECTIONS_PER_USER = 5;

// In-memory map tracking how many active sockets each user has.
// key: userId (string)  →  value: Set of socketIds
const userSocketMap = new Map();

// Create and configure the Socket.io server.
function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    // CORS – mirrors the Express CORS config; tighten in production via env var
    cors: {
      origin: process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },

    // Transport – prefer WebSocket, fall back to long-polling
    transports: ['websocket', 'polling'],

    // Path – configurable so a reverse proxy can route /socket.io separately
    path: process.env.SOCKET_IO_PATH || '/socket.io',

    // Heartbeat / timeout settings
    pingTimeout: 60000,   // 60 s – time to wait for a pong before disconnecting
    pingInterval: 25000,  // 25 s – how often to send a ping

    // Limit incoming message size to 1 MB to prevent memory exhaustion
    maxHttpBufferSize: 1e6,

    // Allow Engine.IO v3 clients (older socket.io-client versions)
    allowEIO3: true,

    // Connection state recovery – buffer events for up to 2 minutes so
    // reconnecting clients receive missed messages
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
  });

  // Redis adapter for horizontal scaling
  _attachRedisAdapter(io);

  // JWT authentication middleware
  io.use(_authMiddleware);

  // Per-user connection-count guard
  io.use(_connectionLimitMiddleware);

  // Register domain event handlers
  io.on('connection', (socket) => {
    _trackConnection(socket);
    registerSocketHandlers(io, socket);

    // Track active connections
    try {
      const metricsService = require('../services/metricsService');
      metricsService.recordSocketConnect();
      socket.once('disconnect', () => metricsService.recordSocketDisconnect());
    } catch (_) { /* metrics are non-fatal */ }
  });

  // Engine-level error logging
  io.engine.on('connection_error', (err) => {
    console.error('[SocketServer] Engine connection error:', {
      code: err.code,
      message: err.message,
    });
  });

  console.log('✓ Socket.io server created');
  return io;
}

// Attach the Redis pub/sub adapter for multi-instance deployments.
// Falls back gracefully if Redis is unavailable so the server still starts in single-node mode.
function _attachRedisAdapter(io) {
  try {
    // ioredis requires a separate client for subscribe mode
    const pubClient = redis;
    const subClient = redis.duplicate();

    io.adapter(createAdapter(pubClient, subClient));
    console.log('✓ Socket.io Redis adapter attached');
  } catch (err) {
    console.warn(
      '[SocketServer] Redis adapter unavailable – running in single-node mode:',
      err.message
    );
  }
}

// Socket.io authentication middleware.
// Reads the JWT from socket.handshake.auth.token or the Authorization header.
// Attaches decoded user data to socket.data.
async function _authMiddleware(socket, next) {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      auditLogger.logAuthFailure({
        reason: 'NO_TOKEN',
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        channel: 'SOCKET',
      });
      try { require('../services/metricsService').recordSocketAuthFailure(); } catch (_) {}
      return next(new Error('AUTH_REQUIRED: Authentication token is required'));
    }

    const secret = process.env.KEY || 'SECRET';
    let decoded;

    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      auditLogger.logAuthFailure({
        reason: jwtErr.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        channel: 'SOCKET',
      });
      try { require('../services/metricsService').recordSocketAuthFailure(); } catch (_) {}
      return next(new Error(`AUTH_FAILED: ${jwtErr.message}`));
    }

    if (!decoded) {
      return next(new Error('AUTH_FAILED: Token payload is empty'));
    }

    // Normalise userId and userType from the existing JWT shapes:
    // Doctor tokens:  { doctorID, userType: 'doctor', email, name, ... }
    // Patient tokens: { patientId, email, name, ... }  (no userType field)
    // This mirrors the logic in chatAuth.js so both REST and WebSocket accept the same tokens.

    let userId, userType, userName;

    if (decoded.userType === 'doctor' && decoded.doctorID) {
      // Resolve numeric doctorID to MongoDB _id — same as chatAuth.js REST middleware
      try {
        const mongoose = require('mongoose');
        const Doctor = mongoose.model('Doctor');
        const doctor = await Doctor.findOne({ doctorId: Number(decoded.doctorID) })
          .select('_id')
          .lean();
        if (!doctor) {
          return next(new Error('AUTH_FAILED: Doctor account not found'));
        }
        userId = doctor._id.toString();
      } catch (dbErr) {
        console.error('[SocketServer] Doctor lookup failed:', dbErr.message);
        return next(new Error('AUTH_ERROR: Could not resolve doctor identity'));
      }
      userType = 'doctor';
      userName = decoded.name || decoded.userName || 'Doctor';
    } else if (decoded.patientId) {
      userId   = decoded.patientId.toString();
      userType = 'patient';
      userName = decoded.name || decoded.userName || 'Patient';
    } else if (decoded.userId) {
      // Future-proof: tokens that already carry a normalised userId field
      userId   = decoded.userId.toString();
      userType = (decoded.userType || decoded.role || '').toLowerCase();
      userName = decoded.name || decoded.userName || 'Unknown';
    } else {
      return next(new Error('AUTH_FAILED: Token payload is missing userId'));
    }

    if (!userType || !['doctor', 'patient'].includes(userType)) {
      return next(new Error('AUTH_FAILED: Token payload has invalid or missing userType'));
    }

    // Attach to socket.data — available in all subsequent handlers
    socket.data.userId   = userId;
    socket.data.userType = userType;
    socket.data.userName = userName;
    socket.data.email    = decoded.email || '';

    next();
  } catch (err) {
    console.error('[SocketServer] Auth middleware error:', err.message);
    next(new Error('AUTH_ERROR: Internal authentication error'));
  }
}

// Enforce the per-user concurrent connection limit.
// Rejects the connection if the user already has MAX_CONNECTIONS_PER_USER active sockets.
function _connectionLimitMiddleware(socket, next) {
  const { userId } = socket.data;

  if (!userId) {
    // Should have been caught by auth middleware, but guard defensively
    return next(new Error('AUTH_REQUIRED: userId not set'));
  }

  const existing = userSocketMap.get(userId);
  const count = existing ? existing.size : 0;

  if (count >= MAX_CONNECTIONS_PER_USER) {
    return next(
      new Error(
        `CONN_LIMIT: Maximum ${MAX_CONNECTIONS_PER_USER} concurrent connections per user exceeded`
      )
    );
  }

  next();
}

// Track a new socket connection in the in-memory map and clean up on disconnect.
function _trackConnection(socket) {
  const { userId } = socket.data;

  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, new Set());
  }
  userSocketMap.get(userId).add(socket.id);

  socket.once('disconnect', () => {
    const sockets = userSocketMap.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        userSocketMap.delete(userId);
      }
    }
  });
}

module.exports = {
  createSocketServer,
  /** Exposed for testing – do not mutate directly in production code */
  userSocketMap,
  MAX_CONNECTIONS_PER_USER,
};
