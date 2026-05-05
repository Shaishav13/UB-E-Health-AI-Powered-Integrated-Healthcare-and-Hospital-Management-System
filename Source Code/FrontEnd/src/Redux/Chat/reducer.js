import * as types from "./actionTypes";

// Requirements: 1.4, 5.1, 7.4, 11.1, 14.2

// ─────────────────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────────────────

const initialState = {
  // ── Conversations ──────────────────────────────────────────────────────────
  conversations: [],          // Array of conversation objects sorted by last activity
  conversationsPagination: null,
  conversationsLoading: false,

  // ── Active Conversation ────────────────────────────────────────────────────
  activeConversationId: null,
  activeConversation: null,   // Full conversation metadata for the open chat

  // ── Messages ───────────────────────────────────────────────────────────────
  // Map of conversationId → { messages: [], pagination: null, loading: false }
  messagesByConversation: {},

  // ── Message Search ─────────────────────────────────────────────────────────
  searchResults: [],
  searchQuery: "",
  searchLoading: false,

  // ── Typing Indicators ──────────────────────────────────────────────────────
  // Map of conversationId → { [userId]: { userName, isTyping, timestamp } }
  typingByConversation: {},

  // ── User Presence ──────────────────────────────────────────────────────────
  // Map of userId → 'online' | 'offline' | 'away'
  presence: {},

  // ── Unread Counts ──────────────────────────────────────────────────────────
  totalUnreadCount: 0,

  // ── General ────────────────────────────────────────────────────────────────
  loading: false,
  error: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return a default per-conversation message bucket.
 */
function emptyMessageBucket() {
  return { messages: [], pagination: null, loading: false };
}

/**
 * Merge a new message into a conversation's message list, preventing duplicates.
 * Messages are kept in ascending chronological order (Req 13.5).
 */
function mergeMessage(existingMessages, newMessage) {
  // Deduplicate by _id; also replace any optimistic (tempId) entry
  const filtered = existingMessages.filter(
    (m) =>
      m._id !== newMessage._id &&
      !(m._tempId && m._tempId === newMessage._tempId)
  );
  const merged = [...filtered, newMessage];
  // Sort ascending by createdAt
  merged.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return merged;
}

/**
 * Move a conversation to the top of the list after new activity (Req 14.7).
 */
function bumpConversation(conversations, updatedConversation) {
  const rest = conversations.filter(
    (c) => c._id !== updatedConversation._id
  );
  return [updatedConversation, ...rest];
}

// ─────────────────────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────────────────────

export default function chatReducer(state = initialState, { type, payload }) {
  switch (type) {

    // ── Fetch Conversations ──────────────────────────────────────────────────

    case types.FETCH_CONVERSATIONS_REQUEST:
      return { ...state, conversationsLoading: true, error: null };

    case types.FETCH_CONVERSATIONS_SUCCESS:
      return {
        ...state,
        conversationsLoading: false,
        conversations: payload.conversations,
        conversationsPagination: payload.pagination,
        error: null,
      };

    case types.FETCH_CONVERSATIONS_ERROR:
      return {
        ...state,
        conversationsLoading: false,
        error: payload.message,
      };

    // ── Fetch Conversation Messages ──────────────────────────────────────────

    case types.FETCH_CONVERSATION_MESSAGES_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case types.FETCH_CONVERSATION_MESSAGES_SUCCESS: {
      const { conversationId, conversation, messages, pagination } = payload;
      return {
        ...state,
        loading: false,
        activeConversation: conversation,
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: {
            // Sort ascending so newest is at the bottom (Req 13.5)
            messages: [...messages].sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            ),
            pagination,
            loading: false,
          },
        },
        error: null,
      };
    }

    case types.FETCH_CONVERSATION_MESSAGES_ERROR:
      return { ...state, loading: false, error: payload.message };

    // ── Load More Messages (older pages) ─────────────────────────────────────

    case types.LOAD_MORE_MESSAGES_REQUEST: {
      return { ...state, loading: true, error: null };
    }

    case types.LOAD_MORE_MESSAGES_SUCCESS: {
      const { conversationId, messages, pagination } = payload;
      const existing = state.messagesByConversation[conversationId] || emptyMessageBucket();
      // Prepend older messages, then deduplicate and sort ascending
      const combined = [...messages, ...existing.messages];
      const deduped = Array.from(
        new Map(combined.map((m) => [m._id, m])).values()
      ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      return {
        ...state,
        loading: false,
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: { messages: deduped, pagination, loading: false },
        },
        error: null,
      };
    }

    case types.LOAD_MORE_MESSAGES_ERROR:
      return { ...state, loading: false, error: payload.message };

    // ── Prefetch Messages (cursor-based, stored but not yet displayed) ────────

    case types.PREFETCH_MESSAGES_REQUEST:
      return state; // no loading indicator for background prefetch

    case types.PREFETCH_MESSAGES_SUCCESS: {
      const { conversationId, messages, pagination } = payload;
      const existing = state.messagesByConversation[conversationId] || emptyMessageBucket();
      // Merge prefetched messages into the bucket (they'll be visible on next scroll)
      const combined = [...messages, ...existing.messages];
      const deduped = Array.from(
        new Map(combined.map((m) => [m._id, m])).values()
      ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      return {
        ...state,
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: {
            ...existing,
            messages: deduped,
            pagination,
            prefetched: true,
          },
        },
      };
    }

    case types.PREFETCH_MESSAGES_ERROR:
      return state; // prefetch failures are silent

    // ── Create Conversation ──────────────────────────────────────────────────

    case types.CREATE_CONVERSATION_REQUEST:
      return { ...state, loading: true, error: null };

    case types.CREATE_CONVERSATION_SUCCESS:
      return {
        ...state,
        loading: false,
        // Add to list only if not already present
        conversations: state.conversations.some((c) => c._id === payload._id)
          ? state.conversations
          : [payload, ...state.conversations],
        error: null,
      };

    case types.CREATE_CONVERSATION_ERROR:
      return { ...state, loading: false, error: payload.message };

    // ── Archive / Unarchive ──────────────────────────────────────────────────

    case types.ARCHIVE_CONVERSATION_REQUEST:
    case types.UNARCHIVE_CONVERSATION_REQUEST:
      return { ...state, loading: true, error: null };

    case types.ARCHIVE_CONVERSATION_SUCCESS:
      return {
        ...state,
        loading: false,
        conversations: state.conversations.map((c) =>
          c._id === payload._id ? payload : c
        ),
        activeConversation:
          state.activeConversation?._id === payload._id
            ? payload
            : state.activeConversation,
        error: null,
      };

    case types.UNARCHIVE_CONVERSATION_SUCCESS:
      return {
        ...state,
        loading: false,
        conversations: state.conversations.map((c) =>
          c._id === payload._id ? payload : c
        ),
        activeConversation:
          state.activeConversation?._id === payload._id
            ? payload
            : state.activeConversation,
        error: null,
      };

    case types.ARCHIVE_CONVERSATION_ERROR:
    case types.UNARCHIVE_CONVERSATION_ERROR:
      return { ...state, loading: false, error: payload.message };

    // ── Send Message (optimistic) ────────────────────────────────────────────

    case types.SEND_MESSAGE: {
      const { tempId, conversationId, content, attachments, isEmergency } = payload;
      const bucket = state.messagesByConversation[conversationId] || emptyMessageBucket();
      const optimisticMessage = {
        _id: tempId,          // temporary ID replaced on confirmation
        _tempId: tempId,
        conversationId,
        content,
        attachments: attachments || [],
        isEmergency: isEmergency || false,
        status: { sent: false, delivered: false, read: false },
        _pending: true,
        createdAt: new Date().toISOString(),
      };

      return {
        ...state,
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: {
            ...bucket,
            messages: [...bucket.messages, optimisticMessage],
          },
        },
      };
    }

    case types.SEND_MESSAGE_CONFIRM: {
      const { tempId, message } = payload;
      const conversationId = message.conversationId;
      const bucket = state.messagesByConversation[conversationId] || emptyMessageBucket();

      // Replace the optimistic entry with the confirmed message
      const messages = bucket.messages.map((m) =>
        m._tempId === tempId ? { ...message, _pending: false } : m
      );

      // Update conversation list preview
      const updatedConversations = state.conversations.map((c) => {
        if (c._id !== conversationId) return c;
        return {
          ...c,
          lastMessage: {
            content: message.content,
            senderId: message.senderId,
            timestamp: message.createdAt,
            type: message.type,
          },
          "metadata.lastActivityAt": message.createdAt,
        };
      });

      return {
        ...state,
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: { ...bucket, messages },
        },
        conversations: updatedConversations,
      };
    }

    case types.SEND_MESSAGE_ERROR: {
      const { tempId } = payload;
      // Mark the optimistic message as failed
      const updated = {};
      for (const [cid, bucket] of Object.entries(state.messagesByConversation)) {
        updated[cid] = {
          ...bucket,
          messages: bucket.messages.map((m) =>
            m._tempId === tempId ? { ...m, _failed: true, _pending: false } : m
          ),
        };
      }
      return {
        ...state,
        messagesByConversation: updated,
        error: payload.message,
      };
    }

    // ── Receive Message (inbound via Socket.io) ──────────────────────────────

    case types.RECEIVE_MESSAGE: {
      const { message, conversationId } = payload;
      const bucket = state.messagesByConversation[conversationId] || emptyMessageBucket();

      // Merge and deduplicate (Req 1.4, 14.2)
      const messages = mergeMessage(bucket.messages, message);

      // Bump conversation to top of list and update preview
      let updatedConv = state.conversations.find((c) => c._id === conversationId);
      
      // Auto-unarchive if the conversation is archived (Req 9.5)
      // Check if the conversation is archived for the current user
      // Since we don't have the current user's role in the reducer, we'll set a flag
      // and let the backend handle the actual unarchive on the next fetch
      if (updatedConv && (updatedConv.isArchived?.doctor || updatedConv.isArchived?.patient)) {
        updatedConv = {
          ...updatedConv,
          _autoUnarchived: true, // flag for UI to handle
        };
      }

      const conversations = updatedConv
        ? bumpConversation(state.conversations, {
            ...updatedConv,
            lastMessage: {
              content: message.content,
              senderId: message.senderId,
              timestamp: message.createdAt,
              type: message.type,
            },
          })
        : state.conversations;

      // Increment unread count unless this is the active conversation
      const isActive = state.activeConversationId === conversationId;
      const updatedConversationsWithUnread = conversations.map((c) => {
        if (c._id !== conversationId || isActive) return c;
        const currentUnread =
          typeof c.unreadCount === "object"
            ? c.unreadCount
            : { doctor: 0, patient: 0 };
        // We don't know the user's role here, so we store a generic counter
        return { ...c, _localUnread: (c._localUnread || 0) + 1 };
      });

      return {
        ...state,
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: { ...bucket, messages },
        },
        conversations: updatedConversationsWithUnread,
        // Increment total unread only when not viewing that conversation
        totalUnreadCount: isActive
          ? state.totalUnreadCount
          : state.totalUnreadCount + 1,
      };
    }

    // ── Mark Message Read ────────────────────────────────────────────────────

    case types.MARK_MESSAGE_READ_REQUEST:
      return { ...state, error: null };

    case types.MARK_MESSAGE_READ_SUCCESS: {
      const { message, conversationId } = payload;
      const bucket = state.messagesByConversation[conversationId] || emptyMessageBucket();

      return {
        ...state,
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: {
            ...bucket,
            messages: bucket.messages.map((m) =>
              m._id === message._id ? message : m
            ),
          },
        },
      };
    }

    case types.MARK_MESSAGE_READ_ERROR:
      return { ...state, error: payload.message };

    // ── Delete Message ───────────────────────────────────────────────────────

    case types.DELETE_MESSAGE_REQUEST:
      return { ...state, error: null };

    case types.DELETE_MESSAGE_SUCCESS: {
      const { messageId, conversationId } = payload;
      const bucket = state.messagesByConversation[conversationId] || emptyMessageBucket();

      return {
        ...state,
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: {
            ...bucket,
            messages: bucket.messages.map((m) =>
              m._id === messageId ? { ...m, isDeleted: true } : m
            ),
          },
        },
      };
    }

    case types.DELETE_MESSAGE_ERROR:
      return { ...state, error: payload.message };

    // ── Socket Receipt Events ────────────────────────────────────────────────

    case types.MESSAGE_DELIVERED: {
      const { messageId, conversationId } = payload;
      const bucket = state.messagesByConversation[conversationId] || emptyMessageBucket();

      return {
        ...state,
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: {
            ...bucket,
            messages: bucket.messages.map((m) =>
              m._id === messageId
                ? { ...m, status: { ...m.status, delivered: true } }
                : m
            ),
          },
        },
      };
    }

    case types.MESSAGE_READ: {
      const { messageId, conversationId, readAt } = payload;
      const bucket = state.messagesByConversation[conversationId] || emptyMessageBucket();

      return {
        ...state,
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: {
            ...bucket,
            messages: bucket.messages.map((m) =>
              m._id === messageId
                ? {
                    ...m,
                    status: {
                      ...m.status,
                      sent: true,
                      delivered: true,
                      read: true,
                      readAt,
                    },
                  }
                : m
            ),
          },
        },
      };
    }

    case types.MESSAGE_DELETED: {
      const { messageId, conversationId } = payload;
      const bucket = state.messagesByConversation[conversationId] || emptyMessageBucket();

      return {
        ...state,
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: {
            ...bucket,
            messages: bucket.messages.map((m) =>
              m._id === messageId ? { ...m, isDeleted: true } : m
            ),
          },
        },
      };
    }

    // ── Typing Indicators ────────────────────────────────────────────────────

    case types.UPDATE_TYPING: {
      const { conversationId, userId, userName, isTyping } = payload;
      const existing = state.typingByConversation[conversationId] || {};

      let updated;
      if (isTyping) {
        updated = {
          ...existing,
          [userId]: { userName, isTyping: true, timestamp: Date.now() },
        };
      } else {
        // Remove the user from the typing map
        const { [userId]: _removed, ...rest } = existing;
        updated = rest;
      }

      return {
        ...state,
        typingByConversation: {
          ...state.typingByConversation,
          [conversationId]: updated,
        },
      };
    }

    // ── User Presence ────────────────────────────────────────────────────────

    case types.UPDATE_PRESENCE: {
      const { userId, status } = payload;
      return {
        ...state,
        presence: { ...state.presence, [userId]: status },
      };
    }

    // ── Unread Counts ────────────────────────────────────────────────────────

    case types.FETCH_UNREAD_COUNT_REQUEST:
      return { ...state, error: null };

    case types.FETCH_UNREAD_COUNT_SUCCESS:
      return {
        ...state,
        totalUnreadCount: payload.unreadCount,
        error: null,
      };

    case types.FETCH_UNREAD_COUNT_ERROR:
      return { ...state, error: payload.message };

    case types.INCREMENT_UNREAD_COUNT:
      return {
        ...state,
        totalUnreadCount: state.totalUnreadCount + 1,
        conversations: state.conversations.map((c) =>
          c._id === payload.conversationId
            ? { ...c, _localUnread: (c._localUnread || 0) + 1 }
            : c
        ),
      };

    case types.DECREMENT_UNREAD_COUNT:
      return {
        ...state,
        totalUnreadCount: Math.max(0, state.totalUnreadCount - 1),
        conversations: state.conversations.map((c) =>
          c._id === payload.conversationId
            ? { ...c, _localUnread: Math.max(0, (c._localUnread || 0) - 1) }
            : c
        ),
      };

    case types.RESET_UNREAD_COUNT:
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c._id === payload.conversationId ? { ...c, _localUnread: 0 } : c
        ),
      };

    // ── Message Search ───────────────────────────────────────────────────────

    case types.SEARCH_MESSAGES_REQUEST:
      return { ...state, searchLoading: true, error: null };

    case types.SEARCH_MESSAGES_SUCCESS:
      return {
        ...state,
        searchLoading: false,
        searchResults: payload.messages,
        searchQuery: payload.query,
        error: null,
      };

    case types.SEARCH_MESSAGES_ERROR:
      return { ...state, searchLoading: false, error: payload.message };

    case types.CLEAR_SEARCH_RESULTS:
      return { ...state, searchResults: [], searchQuery: "" };

    // ── Active Conversation ──────────────────────────────────────────────────

    case types.SET_ACTIVE_CONVERSATION:
      return {
        ...state,
        activeConversationId: payload.conversationId,
      };

    case types.CLEAR_ACTIVE_CONVERSATION:
      return {
        ...state,
        activeConversationId: null,
        activeConversation: null,
      };

    // ── General ──────────────────────────────────────────────────────────────

    case types.CLEAR_CHAT_ERROR:
      return { ...state, error: null };

    case types.RESET_CHAT_STATE:
      return initialState;

    default:
      return state;
  }
}
