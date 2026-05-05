'use strict';

/**
 * Socket Event Handlers
 *
 * Registers all Socket.io event listeners for a single authenticated socket.
 * Called once per connection from socketServer.js.
 *
 * Events handled:
 *   connection    – set presence, join rooms, broadcast user_online  (Req 2.3, 7.1)
 *   send_message  – validate, persist via chatService, emit receipts (Req 1.1, 1.3, 1.4)
 *   typing_start  – store indicator in Redis, broadcast              (Req 5.1, 5.2)
 *   typing_stop   – remove indicator from Redis, broadcast           (Req 5.3, 5.4)
 *   message_read  – update status, emit read_receipt                 (Req 6.3, 6.4)
 *   message_delivered – update status, emit delivery_receipt         (Req 6.2)
 *   disconnect    – set presence offline, broadcast user_offline     (Req 2.4, 7.2)
 *
 * Requirements: 1.1, 1.3, 1.4, 2.3, 2.4, 5.1, 5.2, 5.3, 5.4, 6.3, 6.4, 7.1, 7.2, 7.4
 */

const chatService = require('../services/chatService');
const { joinUserRooms, getRoomId } = require('./roomManager');
const redisHelpers = require('../utils/redisHelpers');
const { redis } = require('../configs/redis');
const { getConversationById } = require('../models/Conversation.model');
const auditLogger = require('../services/auditLogger');
const chatNotificationService = require('../services/chatNotificationService');

// ─── Handler registration ─────────────────────────────────────────────────────

/**
 * Register all event handlers for a connected, authenticated socket.
 *
 * @param {import('socket.io').Server} io     - Socket.io server instance
 * @param {import('socket.io').Socket} socket - Authenticated socket
 */
async function registerSocketHandlers(io, socket) {
  const { userId, userType, userName } = socket.data;

  // ── 1. Connection setup ──────────────────────────────────────────────────

  await _handleConnection(io, socket, userId, userType, userName);

  // ── 2. Domain event listeners ────────────────────────────────────────────

  socket.on('send_message', (data, ack) => _handleSendMessage(io, socket, data, ack));
  socket.on('typing_start', (data) => _handleTypingStart(io, socket, data));
  socket.on('typing_stop', (data) => _handleTypingStop(io, socket, data));
  socket.on('message_read', (data, ack) => _handleMessageRead(io, socket, data, ack));
  socket.on('message_delivered', (data, ack) => _handleMessageDelivered(io, socket, data, ack));
  socket.on('disconnect', (reason) => _handleDisconnect(io, socket, reason));
}

// ─── Connection ───────────────────────────────────────────────────────────────

/**
 * Handle a new authenticated connection.
 *
 * 1. Set user presence to online in Redis
 * 2. Join all active conversation rooms
 * 3. Emit 'connected' confirmation to the connecting socket
 * 4. Broadcast 'user_online' to all conversation rooms the user belongs to
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {string} userId
 * @param {string} userType
 * @param {string} userName
 */
async function _handleConnection(io, socket, userId, userType, userName) {
  try {
    // 1. Mark user online
    await redisHelpers.setUserOnline(redis, userId, {
      userType,
      userName,
      socketId: socket.id,
      activeConversations: [],
    });

    // 2. Join all active conversation rooms
    const joinedRooms = await joinUserRooms(socket, userId, userType);

    // 3. Confirm connection to the client
    socket.emit('connected', {
      socketId: socket.id,
      userId,
      userName,
      userType,
      joinedRooms,
      timestamp: Date.now(),
    });

    // 4. Broadcast online status to all rooms this user is in
    const onlinePayload = {
      userId,
      userType,
      userName,
      timestamp: Date.now(),
    };

    for (const roomId of joinedRooms) {
      socket.to(roomId).emit('user_online', onlinePayload);
    }

    // 5. Audit log: socket connected (Req 19.3)
    auditLogger.logSocketConnected({
      userId,
      userType,
      socketId: socket.id,
      ipAddress: socket.handshake.address,
    });

    console.log(
      `[SocketHandlers] ${userType} "${userName}" (${userId}) connected – ` +
      `socket ${socket.id}, ${joinedRooms.length} room(s)`
    );
  } catch (err) {
    console.error('[SocketHandlers] _handleConnection error:', err.message);
    socket.emit('error', { code: 'CONN_SETUP_FAILED', message: 'Connection setup failed' });
  }
}

// ─── send_message ─────────────────────────────────────────────────────────────

/**
 * Handle the 'send_message' event.
 *
 * Flow:
 *   1. Validate required fields
 *   2. Delegate to chatService.sendMessage (validation, rate-limit, persist)
 *   3. Emit 'message_sent' confirmation to the sender
 *   4. Broadcast 'new_message' to the conversation room (all other sockets)
 *   5. Optionally call ack callback if the client uses acknowledgements
 *
 * Expected payload:
 * {
 *   conversationId: string,   // required
 *   content:        string,   // required
 *   attachmentIds?: string[], // optional – pre-uploaded ChatFile IDs
 *   isEmergency?:   boolean,  // optional – patients only
 *   tempId?:        string,   // optional – client-side temp ID for optimistic UI
 * }
 *
 * Requirements: 1.1, 1.3, 1.4
 */
async function _handleSendMessage(io, socket, data, ack) {
  const { userId, userType, userName } = socket.data;

  // Normalise ack – may be undefined if client doesn't use acknowledgements
  const respond = typeof ack === 'function' ? ack : () => { };

  try {
    // Basic presence check
    if (!data || typeof data !== 'object') {
      const err = { code: 'INVALID_PAYLOAD', message: 'Message payload must be an object' };
      socket.emit('message_error', { tempId: null, ...err });
      return respond({ success: false, ...err });
    }

    const { conversationId, content, attachmentIds = [], isEmergency = false, tempId } = data;

    if (!conversationId) {
      const err = { code: 'MISSING_FIELD', message: 'conversationId is required' };
      socket.emit('message_error', { tempId, ...err });
      return respond({ success: false, ...err });
    }

    if (!content && attachmentIds.length === 0) {
      const err = { code: 'MISSING_FIELD', message: 'content or at least one attachment is required' };
      socket.emit('message_error', { tempId, ...err });
      return respond({ success: false, ...err });
    }

    // Determine senderModel from userType
    const senderModel = userType === 'doctor' ? 'Doctor' : 'Patient';

    // Delegate to chat service (handles validation, rate-limit, sanitisation, persistence)
    const message = await chatService.sendMessage({
      senderId: userId,
      senderModel,
      senderName: userName,
      conversationId,
      content: content || '',
      attachmentIds,
      isEmergency: Boolean(isEmergency),
    });

    // Refresh presence TTL on activity (Req 7.6)
    redisHelpers.refreshPresenceTTL(redis, userId).catch(() => { });

    // Emit confirmation to the sender
    const sentPayload = {
      tempId,
      message: message.toObject ? message.toObject() : message,
      timestamp: Date.now(),
    };
    socket.emit('message_sent', sentPayload);

    // Broadcast to the conversation room (excluding the sender's socket)
    const conversation = await getConversationById(conversationId);
    if (conversation) {
      const doctorId = conversation.doctorId?._id?.toString() || conversation.doctorId?.toString();
      const patientId = conversation.patientId?._id?.toString() || conversation.patientId?.toString();
      const roomId = getRoomId(doctorId, patientId);

      socket.to(roomId).emit('new_message', {
        message: message.toObject ? message.toObject() : message,
        conversationId,
      });

      // ── Notification integration (Req 16.1, 16.2, 16.4, 16.5) ─────────────
      // Fire-and-forget: notifications are non-critical and must not block the
      // socket response.  Errors are logged but not surfaced to the client.
      const senderName = socket.data.userName || 'Unknown';

      if (message.isEmergency) {
        // Emergency: always send push + email immediately, bypass batching (Req 16.2, 10.3, 10.4)
        chatNotificationService
          .sendEmergencyAlert(conversation, message, senderName)
          .catch((notifErr) => {
            console.error('[SocketHandlers] Emergency alert failed:', notifErr.message);
          });
      } else {
        // Regular message: send only if recipient is offline and not batched (Req 16.1, 16.3, 16.4)
        chatNotificationService
          .sendNewMessageNotification(conversation, message, senderName)
          .catch((notifErr) => {
            console.error('[SocketHandlers] New-message notification failed:', notifErr.message);
          });
      }
    }

    respond({ success: true, messageId: message._id });
  } catch (err) {
    console.error('[SocketHandlers] send_message error:', err.message);

    const statusCode = err.statusCode || 500;

    // Audit log: rate limit violation via socket (Req 12.8)
    if (statusCode === 429) {
      auditLogger.logRateLimitViolation({
        userId,
        limitType: 'message',
        count: 0,
        limit: 0,
        ipAddress: socket.handshake.address,
      });
    }

    // Audit log: unauthorized access attempt via socket (Req 19.8)
    if (statusCode === 403) {
      auditLogger.logSecurityEvent({
        action: 'UNAUTHORIZED_SEND_ATTEMPT',
        actorId: userId,
        targetId: data?.conversationId || 'unknown',
        details: {
          reason: err.message,
          ipAddress: socket.handshake.address,
          userType,
        },
      });
    }

    const errorPayload = {
      tempId: data?.tempId,
      code: statusCode === 429 ? 'RATE_LIMITED' : statusCode === 403 ? 'FORBIDDEN' : 'SEND_FAILED',
      message: err.message || 'Failed to send message',
    };

    socket.emit('message_error', errorPayload);
    respond({ success: false, ...errorPayload });
  }
}

// ─── typing_start ─────────────────────────────────────────────────────────────

/**
 * Handle the 'typing_start' event.
 *
 * Stores a typing indicator in Redis (5-second TTL) and broadcasts
 * 'typing_indicator' to the conversation room.
 *
 * Expected payload: { conversationId: string }
 *
 * Requirements: 5.1, 5.2, 5.5
 */
async function _handleTypingStart(io, socket, data) {
  const { userId, userType, userName } = socket.data;

  try {
    if (!data?.conversationId) return;

    const { conversationId } = data;

    // Verify the user is in the room before broadcasting
    const conversation = await getConversationById(conversationId);
    if (!conversation) return;

    const doctorId = conversation.doctorId?._id?.toString() || conversation.doctorId?.toString();
    const patientId = conversation.patientId?._id?.toString() || conversation.patientId?.toString();
    const roomId = getRoomId(doctorId, patientId);

    // Store in Redis with 5-second TTL (Req 5.5)
    await redisHelpers.setTyping(redis, conversationId, userId, { userName, userType });

    // Broadcast to room (Req 5.1, 5.7 – don't echo back to sender)
    socket.to(roomId).emit('typing_indicator', {
      conversationId,
      userId,
      userName,
      userType,
      isTyping: true,
      timestamp: Date.now(),
    });

    // Refresh presence TTL on activity
    redisHelpers.refreshPresenceTTL(redis, userId).catch(() => { });
  } catch (err) {
    console.error('[SocketHandlers] typing_start error:', err.message);
  }
}

// ─── typing_stop ──────────────────────────────────────────────────────────────

/**
 * Handle the 'typing_stop' event.
 *
 * Removes the typing indicator from Redis and broadcasts the stop event.
 *
 * Expected payload: { conversationId: string }
 *
 * Requirements: 5.3, 5.4
 */
async function _handleTypingStop(io, socket, data) {
  const { userId, userType, userName } = socket.data;

  try {
    if (!data?.conversationId) return;

    const { conversationId } = data;

    // Remove from Redis
    await redisHelpers.clearTyping(redis, conversationId, userId);

    // Resolve room and broadcast
    const conversation = await getConversationById(conversationId);
    if (!conversation) return;

    const doctorId = conversation.doctorId?._id?.toString() || conversation.doctorId?.toString();
    const patientId = conversation.patientId?._id?.toString() || conversation.patientId?.toString();
    const roomId = getRoomId(doctorId, patientId);

    socket.to(roomId).emit('typing_indicator', {
      conversationId,
      userId,
      userName,
      userType,
      isTyping: false,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('[SocketHandlers] typing_stop error:', err.message);
  }
}

// ─── message_read ─────────────────────────────────────────────────────────────

/**
 * Handle the 'message_read' event.
 *
 * Marks the message as read via chatService, then emits 'read_receipt' to the
 * conversation room so the original sender's UI updates.
 *
 * Expected payload: { messageId: string, conversationId: string }
 *
 * Requirements: 6.3, 6.4
 */
async function _handleMessageRead(io, socket, data, ack) {
  const { userId } = socket.data;
  const respond = typeof ack === 'function' ? ack : () => { };

  try {
    if (!data?.messageId) {
      return respond({ success: false, code: 'MISSING_FIELD', message: 'messageId is required' });
    }

    const { messageId, conversationId } = data;

    // Delegate to chat service (validates access, updates DB, decrements unread)
    // Note: chatService.markAsRead already writes the MESSAGE/READ audit log entry
    const updatedMessage = await chatService.markAsRead(messageId, userId);

    // Refresh presence TTL on activity
    redisHelpers.refreshPresenceTTL(redis, userId).catch(() => { });

    // Broadcast read receipt to the conversation room
    if (conversationId) {
      const conversation = await getConversationById(conversationId);
      if (conversation) {
        const doctorId = conversation.doctorId?._id?.toString() || conversation.doctorId?.toString();
        const patientId = conversation.patientId?._id?.toString() || conversation.patientId?.toString();
        const roomId = getRoomId(doctorId, patientId);

        io.to(roomId).emit('read_receipt', {
          messageId,
          conversationId,
          readBy: userId,
          readAt: updatedMessage.status?.readAt || new Date(),
          timestamp: Date.now(),
        });
      }
    }

    respond({ success: true, messageId });
  } catch (err) {
    console.error('[SocketHandlers] message_read error:', err.message);

    // Audit log: unauthorized read attempt via socket (Req 19.8)
    if (err.statusCode === 403) {
      auditLogger.logSecurityEvent({
        action: 'UNAUTHORIZED_READ_ATTEMPT',
        actorId: userId,
        targetId: data?.messageId || 'unknown',
        details: {
          reason: err.message,
          conversationId: data?.conversationId || 'unknown',
          ipAddress: socket.handshake.address,
        },
      });
    }

    respond({
      success: false,
      code: err.statusCode === 403 ? 'FORBIDDEN' : 'READ_FAILED',
      message: err.message || 'Failed to mark message as read',
    });
  }
}

// ─── message_delivered ────────────────────────────────────────────────────────

/**
 * Handle the 'message_delivered' event.
 *
 * Marks the message as delivered via chatService, then emits 'delivery_receipt'
 * to the conversation room.
 *
 * Expected payload: { messageId: string, conversationId: string }
 *
 * Requirements: 6.2, 6.4
 */
async function _handleMessageDelivered(io, socket, data, ack) {
  const { userId } = socket.data;
  const respond = typeof ack === 'function' ? ack : () => { };

  try {
    if (!data?.messageId) {
      return respond({ success: false, code: 'MISSING_FIELD', message: 'messageId is required' });
    }

    const { messageId, conversationId } = data;

    // Delegate to chat service
    const updatedMessage = await chatService.markAsDelivered(messageId, userId);

    // Audit log: message delivered via socket (Req 19.1)
    auditLogger.logMessageDelivered({
      messageId: messageId.toString(),
      conversationId: conversationId ? conversationId.toString() : 'unknown',
      recipientId: userId,
      recipientModel: socket.data.userType === 'doctor' ? 'Doctor' : 'Patient',
    });

    // Refresh presence TTL on activity
    redisHelpers.refreshPresenceTTL(redis, userId).catch(() => { });

    // Broadcast delivery receipt to the conversation room
    if (conversationId) {
      const conversation = await getConversationById(conversationId);
      if (conversation) {
        const doctorId = conversation.doctorId?._id?.toString() || conversation.doctorId?.toString();
        const patientId = conversation.patientId?._id?.toString() || conversation.patientId?.toString();
        const roomId = getRoomId(doctorId, patientId);

        io.to(roomId).emit('delivery_receipt', {
          messageId,
          conversationId,
          deliveredTo: userId,
          timestamp: Date.now(),
        });
      }
    }

    respond({ success: true, messageId });
  } catch (err) {
    console.error('[SocketHandlers] message_delivered error:', err.message);
    respond({
      success: false,
      code: err.statusCode === 403 ? 'FORBIDDEN' : 'DELIVERY_FAILED',
      message: err.message || 'Failed to mark message as delivered',
    });
  }
}

// ─── disconnect ───────────────────────────────────────────────────────────────

/**
 * Handle the 'disconnect' event.
 *
 * 1. Set user presence to offline in Redis
 * 2. Broadcast 'user_offline' to all rooms the socket was in
 *
 * Requirements: 2.4, 7.2
 */
async function _handleDisconnect(io, socket, reason) {
  const { userId, userType, userName } = socket.data;

  try {
    // 1. Mark user offline (keeps record for 24 h so "last seen" is readable)
    await redisHelpers.setUserOffline(redis, userId, { userType, userName });

    // 2. Broadcast offline status to all rooms this socket was in.
    //    socket.rooms still contains the rooms at disconnect time.
    const offlinePayload = {
      userId,
      userType,
      userName,
      lastSeen: Date.now(),
      timestamp: Date.now(),
    };

    for (const roomId of socket.rooms) {
      // Skip the socket's own room (socket.id)
      if (roomId === socket.id) continue;
      socket.to(roomId).emit('user_offline', offlinePayload);
    }

    // 3. Audit log: socket disconnected (Req 19.3)
    auditLogger.logSocketDisconnected({
      userId,
      userType,
      socketId: socket.id,
      reason,
    });

    console.log(
      `[SocketHandlers] ${userType} "${userName}" (${userId}) disconnected – ` +
      `reason: ${reason}`
    );
  } catch (err) {
    console.error('[SocketHandlers] disconnect handler error:', err.message);
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  registerSocketHandlers,
};
