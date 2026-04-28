import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaUserMd, FaUser, FaArchive, FaSearch, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { MdEmergency } from 'react-icons/md';
import {
  fetchConversationMessages,
  loadMoreMessages,
  markMessageAsRead,
  setActiveConversation,
  archiveConversation,
} from '../../Redux/Chat/action';
import { emitMessageDelivered } from '../../services/socketService';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import './ChatWindow.css';

// Requirements: 1.4, 5.1, 7.7, 13.1, 13.2

/**
 * Resolve a participant field (populated object or plain string ID).
 */
function resolveParticipant(field) {
  if (!field) return { _id: '', name: 'Unknown', profilePicture: null };
  if (typeof field === 'object') {
    return {
      _id: field._id || '',
      name: field.name || 'Unknown',
      profilePicture: field.profilePicture || null,
    };
  }
  return { _id: field, name: 'Unknown', profilePicture: null };
}

/**
 * ChatWindow — displays the active conversation with messages, header, and input.
 *
 * Props:
 *   conversation  — conversation object (from ConversationList selection)
 *   onClose       — optional function called when the window is closed (mobile)
 */
const ChatWindow = ({ conversation, onClose }) => {
  const dispatch = useDispatch();

  // ── Redux state ────────────────────────────────────────────────────────────
  const currentUser = useSelector((state) => state.auth?.data?.user);
  const { messagesByConversation, typingByConversation, presence, loading } =
    useSelector((state) => state.chat);

  const conversationId = conversation?._id;
  const bucket = messagesByConversation[conversationId] || { messages: [], pagination: null, loading: false };
  const messages = bucket.messages || [];
  const pagination = bucket.pagination;

  // Typing users for this conversation (exclude self)
  const typingMap = typingByConversation[conversationId] || {};
  const typingUsers = Object.entries(typingMap)
    .filter(([uid]) => uid !== currentUser?._id)
    .map(([, info]) => info);

  // ── Local state ────────────────────────────────────────────────────────────
  const [loadingMore, setLoadingMore] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  // ── Derived: other participant ─────────────────────────────────────────────
  const otherParticipant = (() => {
    if (!conversation || !currentUser) return { _id: '', name: 'Unknown', role: 'Patient' };
    if (currentUser.userType === 'doctor') {
      return { ...resolveParticipant(conversation.patientId), role: 'Patient' };
    }
    return { ...resolveParticipant(conversation.doctorId), role: 'Doctor' };
  })();

  const otherPresence = (presence && otherParticipant._id)
    ? (presence[otherParticipant._id] || 'offline')
    : 'offline';

  // ── Load messages on conversation change ──────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;

    isInitialLoadRef.current = true;
    setCurrentPage(1);
    setHasMore(false);

    dispatch(setActiveConversation(conversationId));
    dispatch(fetchConversationMessages(conversationId, { page: 1, limit: 50 }));
  }, [conversationId, dispatch]);

  // ── Update hasMore when pagination changes ─────────────────────────────────
  useEffect(() => {
    if (pagination) {
      setHasMore(pagination.currentPage < pagination.totalPages);
    }
  }, [pagination]);

  // ── Auto-scroll to bottom on new messages ─────────────────────────────────
  useEffect(() => {
    if (isInitialLoadRef.current && messages.length > 0) {
      scrollToBottom('auto');
      isInitialLoadRef.current = false;
      return;
    }

    // Only auto-scroll if user is near the bottom
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 150) {
      scrollToBottom('smooth');
    }
  }, [messages.length]);

  // ── Emit delivered for incoming messages ──────────────────────────────────
  useEffect(() => {
    if (!currentUser || !conversationId) return;
    messages.forEach((msg) => {
      if (
        msg.senderId !== currentUser._id &&
        msg.senderId?._id !== currentUser._id &&
        msg.status &&
        !msg.status.delivered &&
        !msg._pending
      ) {
        emitMessageDelivered(msg._id, conversationId);
      }
    });
  }, [messages, currentUser, conversationId]);

  // ── Mark visible messages as read ─────────────────────────────────────────
  useEffect(() => {
    if (!currentUser || !conversationId) return;
    messages.forEach((msg) => {
      const senderId = typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId;
      if (
        senderId !== currentUser._id &&
        msg.status &&
        !msg.status.read &&
        !msg.isDeleted &&
        !msg._pending
      ) {
        dispatch(markMessageAsRead(msg._id, conversationId));
      }
    });
  }, [messages, currentUser, conversationId, dispatch]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // ── Infinite scroll: load older messages ──────────────────────────────────
  const handleScroll = useCallback(async () => {
    const container = messagesContainerRef.current;
    if (!container || loadingMore || !hasMore) return;

    if (container.scrollTop < 80) {
      setLoadingMore(true);
      prevScrollHeightRef.current = container.scrollHeight;

      const nextPage = currentPage + 1;
      await dispatch(loadMoreMessages(conversationId, nextPage));
      setCurrentPage(nextPage);
      setLoadingMore(false);

      // Restore scroll position after prepend
      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - prevScrollHeightRef.current;
        }
      });
    }
  }, [loadingMore, hasMore, currentPage, conversationId, dispatch]);

  // ── Archive handler ────────────────────────────────────────────────────────
  const handleArchive = async () => {
    if (!conversationId) return;
    await dispatch(archiveConversation(conversationId));
    onClose?.();
  };

  // ── Empty / no conversation state ──────────────────────────────────────────
  if (!conversation) {
    return (
      <div className="chat-window chat-window-empty">
        <div className="chat-window-empty-content">
          <div className="chat-window-empty-icon">💬</div>
          <h3 className="chat-window-empty-title">Select a conversation</h3>
          <p className="chat-window-empty-subtitle">
            Choose a conversation from the list to start messaging.
          </p>
        </div>
      </div>
    );
  }

  const avatarLetter = otherParticipant.name?.charAt(0).toUpperCase() || '?';

  return (
    <div className="chat-window">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={`chat-window-header${conversation.isEmergency ? ' emergency' : ''}`}>
        <div className="chat-window-header-left">
          {onClose && (
            <button
              className="chat-window-back-btn"
              onClick={onClose}
              aria-label="Back to conversations"
            >
              ‹
            </button>
          )}

          {/* Avatar */}
          <div className={`chat-window-avatar status-${otherPresence}`}>
            {otherParticipant.profilePicture ? (
              <img src={otherParticipant.profilePicture} alt={otherParticipant.name} />
            ) : (
              <span className="chat-window-avatar-letter">{avatarLetter}</span>
            )}
            <span className={`chat-window-status-dot dot-${otherPresence}`} />
          </div>

          {/* Participant info */}
          <div className="chat-window-participant-info">
            <div className="chat-window-participant-name">
              {otherParticipant.name}
              {conversation.isEmergency && (
                <span className="chat-window-emergency-badge" title="Emergency conversation">
                  <MdEmergency size={14} />
                </span>
              )}
            </div>
            <div className="chat-window-participant-meta">
              <span className={`chat-window-role-badge role-${otherParticipant.role.toLowerCase()}`}>
                {otherParticipant.role === 'Doctor' ? <FaUserMd size={10} /> : <FaUser size={10} />}
                {' '}{otherParticipant.role}
              </span>
              <span className={`chat-window-presence-text presence-${otherPresence}`}>
                {otherPresence === 'online' ? 'Online' : otherPresence === 'away' ? 'Away' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Header actions */}
        <div className="chat-window-header-actions">
          <button
            className={`chat-window-action-btn${showSearch ? ' active' : ''}`}
            onClick={() => setShowSearch((v) => !v)}
            title="Search messages"
            aria-label="Search messages"
          >
            <FaSearch size={14} />
          </button>
          <button
            className="chat-window-action-btn"
            onClick={handleArchive}
            title="Archive conversation"
            aria-label="Archive conversation"
          >
            <FaArchive size={14} />
          </button>
        </div>
      </div>

      {/* ── Emergency banner ───────────────────────────────────────────────── */}
      {conversation.isEmergency && (
        <div className="chat-window-emergency-banner" role="alert">
          <FaExclamationTriangle size={14} />
          This conversation has been flagged as an emergency.
        </div>
      )}

      {/* ── Messages container ─────────────────────────────────────────────── */}
      <div
        className="chat-window-messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-label="Conversation messages"
      >
        {/* Load more indicator */}
        {loadingMore && (
          <div className="chat-window-load-more">
            <div className="chat-window-spinner" aria-label="Loading older messages" />
            <span>Loading older messages…</span>
          </div>
        )}

        {/* Initial loading skeleton */}
        {loading && messages.length === 0 && (
          <div className="chat-window-loading">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`message-skeleton ${i % 2 === 0 ? 'left' : 'right'}`}>
                <div className="skeleton-bubble shimmer" />
              </div>
            ))}
          </div>
        )}

        {/* No messages state */}
        {!loading && messages.length === 0 && (
          <div className="chat-window-no-messages">
            <p>No messages yet. Say hello! 👋</p>
          </div>
        )}

        {/* Message list */}
        {messages.map((message) => (
          <MessageBubble
            key={message._id || message._tempId}
            message={message}
            currentUser={currentUser}
          />
        ))}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator
            typingUsers={typingUsers}
            conversationId={conversationId}
          />
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Message input ──────────────────────────────────────────────────── */}
      <MessageInput
        conversationId={conversationId}
        currentUser={currentUser}
      />
    </div>
  );
};

export default ChatWindow;
