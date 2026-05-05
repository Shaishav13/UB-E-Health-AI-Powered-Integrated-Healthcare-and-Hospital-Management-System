/**
 * useChatSocket — React hook
 *
 * Integrates the Socket.io client service with the Redux store.
 * Mount this hook once at the top of the authenticated chat layout so the
 * socket connection is established when the user logs in and torn down on
 * logout.
 *
 * Requirements: 1.3, 1.4, 5.1, 6.4, 7.4
 *
 * Usage:
 *   const { socket, connected, emitSendMessage, emitTypingStart, ... } = useChatSocket();
 */

import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  initSocketService,
  connect,
  disconnect,
  getSocket,
  isConnected,
  emitSendMessage as _emitSendMessage,
  emitTypingStart as _emitTypingStart,
  emitTypingStop as _emitTypingStop,
  emitMessageRead as _emitMessageRead,
  emitMessageDelivered as _emitMessageDelivered,
} from "./socketService";

/**
 * @typedef {object} ChatSocketAPI
 * @property {import("socket.io-client").Socket | null} socket - Raw socket instance
 * @property {boolean} connected - Whether the socket is currently connected
 * @property {(payload: object) => void} emitSendMessage
 * @property {(conversationId: string) => void} emitTypingStart
 * @property {(conversationId: string) => void} emitTypingStop
 * @property {(messageId: string, conversationId: string) => void} emitMessageRead
 * @property {(messageId: string, conversationId: string) => void} emitMessageDelivered
 */

/**
 * Hook that manages the Socket.io connection lifecycle and exposes emitter
 * helpers bound to the current Redux dispatch.
 *
 * @returns {ChatSocketAPI}
 */
export function useChatSocket() {
  const dispatch = useDispatch();

  // Read the auth token from Redux state (mirrors what the rest of the app uses)
  const token = useSelector((state) => state.auth?.token);

  // Track connected state in a ref so we can expose it without causing
  // unnecessary re-renders on every socket event.
  const connectedRef = useRef(isConnected());

  useEffect(() => {
    if (!token) {
      // No token — ensure any stale socket is cleaned up
      disconnect();
      connectedRef.current = false;
      return;
    }

    // Inject dispatch so the service can update Redux on socket events
    initSocketService(dispatch);

    // Establish (or reuse) the connection
    const sock = connect();
    if (sock) {
      connectedRef.current = sock.connected;

      const onConnect = () => {
        connectedRef.current = true;
      };
      const onDisconnect = () => {
        connectedRef.current = false;
      };

      sock.on("connect", onConnect);
      sock.on("disconnect", onDisconnect);

      return () => {
        sock.off("connect", onConnect);
        sock.off("disconnect", onDisconnect);
      };
    }

    // Cleanup: disconnect when the component unmounts (e.g. user logs out)
    return () => {
      disconnect();
      connectedRef.current = false;
    };
  }, [token, dispatch]);

  // ── Stable emitter callbacks ───────────────────────────────────────────────
  // Wrapped in useCallback so consumers can safely include them in dependency
  // arrays without triggering infinite loops.

  /**
   * Send a message, queuing it locally if the socket is offline.
   * Requirements: 1.1, 23.2
   */
  const emitSendMessage = useCallback((payload) => {
    _emitSendMessage(payload);
  }, []);

  /**
   * Notify the room that the current user started typing.
   * Requirements: 5.1
   */
  const emitTypingStart = useCallback((conversationId) => {
    _emitTypingStart(conversationId);
  }, []);

  /**
   * Notify the room that the current user stopped typing.
   * Requirements: 5.3
   */
  const emitTypingStop = useCallback((conversationId) => {
    _emitTypingStop(conversationId);
  }, []);

  /**
   * Emit a read receipt for a message.
   * Requirements: 6.3
   */
  const emitMessageRead = useCallback((messageId, conversationId) => {
    _emitMessageRead(messageId, conversationId);
  }, []);

  /**
   * Emit a delivery receipt for a message.
   * Requirements: 6.2
   */
  const emitMessageDelivered = useCallback((messageId, conversationId) => {
    _emitMessageDelivered(messageId, conversationId);
  }, []);

  return {
    socket: getSocket(),
    connected: connectedRef.current,
    emitSendMessage,
    emitTypingStart,
    emitTypingStop,
    emitMessageRead,
    emitMessageDelivered,
  };
}
