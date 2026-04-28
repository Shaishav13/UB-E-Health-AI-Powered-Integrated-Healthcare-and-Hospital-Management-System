/**
 * Socket.io Client Service
 *
 * Manages the WebSocket connection lifecycle, event listeners, and event
 * emitters for the Doctor-Patient Chat System.
 *
 * Requirements: 2.1, 2.5, 2.6, 23.1, 23.2
 *
 * Design:
 *  - Single shared socket instance (module-level singleton)
 *  - JWT token injected at connection time from localStorage
 *  - Exponential backoff reconnection: 1s → 2s → 4s → 8s → 16s → 30s (max)
 *  - Redux store dispatch injected via initSocketService() so this module
 *    stays framework-agnostic and testable
 */

import { io } from "socket.io-client";
import {
  receiveMessage,
  confirmSentMessage,
  messageDelivered,
  messageRead,
  messageDeleted,
  updateTyping,
  updatePresence,
} from "../Redux/Chat/action";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://127.0.0.1:3001";

/**
 * Exponential backoff delays in milliseconds.
 * After the last entry the delay is capped at MAX_RECONNECT_DELAY.
 * Requirements: 23.1, 23.8
 */
const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];
const MAX_RECONNECT_DELAY = 30000;
const MAX_RECONNECT_ATTEMPTS = 10; // Req 23.8: suggest check after 5+ failures

// ─────────────────────────────────────────────────────────────────────────────
// Module-level state
// ─────────────────────────────────────────────────────────────────────────────

/** @type {import("socket.io-client").Socket | null} */
let socket = null;

/** Redux dispatch function injected via initSocketService(). */
let _dispatch = null;

/** Pending message queue for offline resilience (Req 23.2). */
let _pendingMessages = [];

/** Manual reconnect attempt counter (used for backoff). */
let _reconnectAttempts = 0;

/** setTimeout handle for manual reconnect scheduling. */
let _reconnectTimer = null;

/** Whether the service has been intentionally disconnected. */
let _intentionalDisconnect = false;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the next backoff delay based on the current attempt count.
 * @param {number} attempt - Zero-based attempt index.
 * @returns {number} Delay in milliseconds.
 */
function getBackoffDelay(attempt) {
  if (attempt < BACKOFF_DELAYS.length) {
    return BACKOFF_DELAYS[attempt];
  }
  return MAX_RECONNECT_DELAY;
}

/**
 * Safely dispatch a Redux action if a dispatch function has been injected.
 * @param {object} action
 */
function dispatch(action) {
  if (typeof _dispatch === "function") {
    _dispatch(action);
  }
}

/**
 * Flush any messages that were queued while the socket was offline.
 * Requirements: 23.2
 */
function flushPendingMessages() {
  if (!socket || !socket.connected || _pendingMessages.length === 0) return;

  const toSend = [..._pendingMessages];
  _pendingMessages = [];

  toSend.forEach((payload) => {
    socket.emit("send_message", payload);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Event listener registration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attach all inbound Socket.io event listeners to the socket instance.
 * Called once after a successful connection.
 */
function registerEventListeners() {
  if (!socket) return;

  // ── Connection lifecycle ──────────────────────────────────────────────────

  socket.on("connect", () => {
    _reconnectAttempts = 0;
    clearTimeout(_reconnectTimer);
    flushPendingMessages();
  });

  socket.on("disconnect", (reason) => {
    // Socket.io handles reconnection for transport-level drops automatically.
    // We only schedule a manual reconnect for server-initiated disconnects
    // that socket.io won't retry on its own.
    if (!_intentionalDisconnect && reason === "io server disconnect") {
      scheduleReconnect();
    }
  });

  socket.on("connect_error", () => {
    if (!_intentionalDisconnect) {
      scheduleReconnect();
    }
  });

  // ── Inbound message events ────────────────────────────────────────────────

  /**
   * New message received from another participant.
   * Requirements: 1.4
   */
  socket.on("new_message", ({ message, conversationId }) => {
    dispatch(receiveMessage(message, conversationId));
  });

  /**
   * Server confirmation that our sent message was saved.
   * Replaces the optimistic entry in the Redux store.
   * Requirements: 1.3
   */
  socket.on("message_sent", ({ tempId, message }) => {
    dispatch(confirmSentMessage(tempId, message));
  });

  /**
   * Delivery receipt: recipient's client received the message.
   * Requirements: 6.2
   */
  socket.on("delivery_receipt", ({ messageId, conversationId }) => {
    dispatch(messageDelivered(messageId, conversationId));
  });

  /**
   * Read receipt: recipient has viewed the message.
   * Requirements: 6.3, 6.4
   */
  socket.on("read_receipt", ({ messageId, conversationId, readAt }) => {
    dispatch(messageRead(messageId, conversationId, readAt));
  });

  /**
   * A message was deleted by its sender.
   * Requirements: 15.7
   */
  socket.on("message_deleted", ({ messageId, conversationId }) => {
    dispatch(messageDeleted(messageId, conversationId));
  });

  // ── Typing indicators ─────────────────────────────────────────────────────

  /**
   * Another participant started or stopped typing.
   * Requirements: 5.1, 5.2
   */
  socket.on("typing_indicator", ({ conversationId, userId, userName, isTyping }) => {
    dispatch(updateTyping(conversationId, userId, userName, isTyping));
  });

  // ── Presence events ───────────────────────────────────────────────────────

  /**
   * A participant came online.
   * Requirements: 7.4
   */
  socket.on("user_online", ({ userId }) => {
    dispatch(updatePresence(userId, "online"));
  });

  /**
   * A participant went offline.
   * Requirements: 7.4
   */
  socket.on("user_offline", ({ userId }) => {
    dispatch(updatePresence(userId, "offline"));
  });

  // ── Error handling ────────────────────────────────────────────────────────

  socket.on("message_error", ({ tempId, error, code }) => {
    // Errors for individual messages are handled by the Redux action layer.
    // Log here for debugging without exposing internals to the user (Req 23.6).
    console.error("[SocketService] message_error", { tempId, error, code });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual reconnection (exponential backoff)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Schedule a manual reconnection attempt with exponential backoff.
 * Used when socket.io's built-in reconnection is not applicable
 * (e.g. server-initiated disconnects, auth failures after token refresh).
 * Requirements: 23.1, 23.8
 */
function scheduleReconnect() {
  if (_intentionalDisconnect) return;

  clearTimeout(_reconnectTimer);

  if (_reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.warn(
      "[SocketService] Max reconnect attempts reached. Please check your internet connection."
    );
    return;
  }

  const delay = getBackoffDelay(_reconnectAttempts);
  _reconnectAttempts += 1;

  _reconnectTimer = setTimeout(() => {
    const token = localStorage.getItem("token");
    if (token && socket) {
      socket.auth = { token };
      socket.connect();
    }
  }, delay);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inject the Redux store's dispatch function.
 * Must be called once before connect() so that socket events can update state.
 *
 * @param {Function} dispatchFn - Redux store.dispatch
 */
export function initSocketService(dispatchFn) {
  _dispatch = dispatchFn;
}

/**
 * Establish the Socket.io connection using the JWT token from localStorage.
 * Idempotent: calling connect() when already connected is a no-op.
 * Requirements: 2.1
 *
 * @returns {import("socket.io-client").Socket | null}
 */
export function connect() {
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("[SocketService] No auth token found. Cannot connect.");
    return null;
  }

  // Already connected — return existing socket
  if (socket && socket.connected) {
    return socket;
  }

  _intentionalDisconnect = false;

  socket = io(SOCKET_URL, {
    auth: { token },
    // Disable socket.io's built-in reconnection so we control backoff ourselves
    reconnection: false,
    timeout: 10000,
    transports: ["websocket", "polling"],
  });

  registerEventListeners();

  return socket;
}

/**
 * Gracefully disconnect the socket.
 * Sets the intentional flag so reconnect logic does not fire.
 * Requirements: 2.4
 */
export function disconnect() {
  _intentionalDisconnect = true;
  clearTimeout(_reconnectTimer);

  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Return the current socket instance (may be null if not connected).
 * @returns {import("socket.io-client").Socket | null}
 */
export function getSocket() {
  return socket;
}

/**
 * Return whether the socket is currently connected.
 * @returns {boolean}
 */
export function isConnected() {
  return !!(socket && socket.connected);
}

// ─────────────────────────────────────────────────────────────────────────────
// Outbound event emitters
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send a chat message.
 * If the socket is offline the payload is queued and flushed on reconnect.
 * Requirements: 1.1, 23.2
 *
 * @param {object} payload - { conversationId, content, attachmentIds?, isEmergency?, tempId }
 */
export function emitSendMessage(payload) {
  if (socket && socket.connected) {
    socket.emit("send_message", payload);
  } else {
    // Queue for delivery when connection is restored (Req 23.2)
    _pendingMessages.push(payload);
  }
}

/**
 * Notify the server that the current user started typing.
 * Requirements: 5.1, 5.3
 *
 * @param {string} conversationId
 */
export function emitTypingStart(conversationId) {
  if (socket && socket.connected) {
    socket.emit("typing_start", { conversationId });
  }
}

/**
 * Notify the server that the current user stopped typing.
 * Requirements: 5.3, 5.4
 *
 * @param {string} conversationId
 */
export function emitTypingStop(conversationId) {
  if (socket && socket.connected) {
    socket.emit("typing_stop", { conversationId });
  }
}

/**
 * Notify the server that the current user has read a message.
 * Requirements: 6.3
 *
 * @param {string} messageId
 * @param {string} conversationId
 */
export function emitMessageRead(messageId, conversationId) {
  if (socket && socket.connected) {
    socket.emit("message_read", { messageId, conversationId });
  }
}

/**
 * Notify the server that a message has been delivered to this client.
 * Requirements: 6.2
 *
 * @param {string} messageId
 * @param {string} conversationId
 */
export function emitMessageDelivered(messageId, conversationId) {
  if (socket && socket.connected) {
    socket.emit("message_delivered", { messageId, conversationId });
  }
}
