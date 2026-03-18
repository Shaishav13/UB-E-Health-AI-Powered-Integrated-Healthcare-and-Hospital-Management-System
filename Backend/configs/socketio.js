const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { redis } = require('./redis');
require('dotenv').config();

/**
 * Socket.io Server Configuration for Real-Time Chat
 * 
 * Purpose: Configures Socket.io server with:
 * - CORS settings for frontend connection
 * - JWT authentication middleware
 * - Redis adapter for horizontal scaling
 * - Connection management
 * 
 * Requirements: 2.1, 2.2
 */

/**
 * Initialize Socket.io server
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} Socket.io server instance
 */
function initializeSocketIO(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: process.env.SOCKET_IO_PATH || '/socket.io',
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6, // 1MB
    allowEIO3: true,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.KEY || 'SECRET');

      if (!decoded || !decoded.userId) {
        return next(new Error('Invalid token payload'));
      }

      // Attach user data to socket
      socket.data.userId = decoded.userId;
      socket.data.userType = decoded.userType || decoded.role;
      socket.data.userName = decoded.name || decoded.userName;
      socket.data.email = decoded.email;

      console.log(`✓ Socket authenticated: ${socket.data.userName} (${socket.data.userType})`);
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication failed: ' + error.message));
    }
  });

  // Connection event handler
  io.on('connection', async (socket) => {
    const { userId, userType, userName } = socket.data;

    console.log(`🔌 User connected: ${userName} (${userId}) - Socket ID: ${socket.id}`);

    try {
      // Set user online status in Redis
      await redis.setex(
        `presence:${userId}`,
        1800, // 30 minutes TTL
        JSON.stringify({
          userId,
          userType,
          userName,
          status: 'online',
          socketId: socket.id,
          lastSeen: Date.now(),
        })
      );

      // Emit connection success to client
      socket.emit('connected', {
        socketId: socket.id,
        userId,
        userName,
        timestamp: Date.now(),
      });

      // Handle disconnection
      socket.on('disconnect', async (reason) => {
        console.log(`🔌 User disconnected: ${userName} (${userId}) - Reason: ${reason}`);

        try {
          // Update presence to offline
          await redis.setex(
            `presence:${userId}`,
            86400, // Keep for 24 hours
            JSON.stringify({
              userId,
              userType,
              userName,
              status: 'offline',
              lastSeen: Date.now(),
            })
          );

          // Broadcast offline status to relevant users
          socket.broadcast.emit('user_offline', {
            userId,
            userType,
            lastSeen: new Date(),
          });
        } catch (error) {
          console.error('Error handling disconnect:', error.message);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for user ${userId}:`, error.message);
      });

    } catch (error) {
      console.error('Error in connection handler:', error.message);
      socket.emit('error', { message: 'Connection setup failed' });
    }
  });

  // Global error handler
  io.engine.on('connection_error', (err) => {
    console.error('Socket.io connection error:', {
      code: err.code,
      message: err.message,
      context: err.context,
    });
  });

  console.log('✓ Socket.io server initialized successfully');
  return io;
}

/**
 * Helper function to emit event to specific user
 * @param {Server} io - Socket.io server instance
 * @param {string} userId - Target user ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
async function emitToUser(io, userId, event, data) {
  try {
    // Get user's socket ID from Redis
    const presenceData = await redis.get(`presence:${userId}`);
    
    if (presenceData) {
      const presence = JSON.parse(presenceData);
      if (presence.socketId && presence.status === 'online') {
        io.to(presence.socketId).emit(event, data);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error emitting to user:', error.message);
    return false;
  }
}

/**
 * Helper function to broadcast to room
 * @param {Server} io - Socket.io server instance
 * @param {string} roomId - Room ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
function broadcastToRoom(io, roomId, event, data) {
  io.to(roomId).emit(event, data);
}

/**
 * Helper function to check if user is online
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if online, false otherwise
 */
async function isUserOnline(userId) {
  try {
    const presenceData = await redis.get(`presence:${userId}`);
    if (presenceData) {
      const presence = JSON.parse(presenceData);
      return presence.status === 'online';
    }
    return false;
  } catch (error) {
    console.error('Error checking user online status:', error.message);
    return false;
  }
}

module.exports = {
  initializeSocketIO,
  emitToUser,
  broadcastToRoom,
  isUserOnline,
};
