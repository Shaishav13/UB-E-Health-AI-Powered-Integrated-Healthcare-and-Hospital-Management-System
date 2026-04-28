import axios from "axios";
import * as types from "./actionTypes";

// Requirements: 1.1, 6.3, 8.1, 9.1, 9.4, 13.1, 14.1

const API_URL = "http://127.0.0.1:3001";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the Authorization header from localStorage (matches the rest of the app).
 */
function authHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: token };
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversation Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all conversations for the authenticated user.
 * Supports pagination and optional filters (includeArchived, emergencyOnly).
 * Requirements: 14.1, 14.2
 */
export const fetchConversations =
  (params = {}) =>
  async (dispatch) => {
    dispatch({ type: types.FETCH_CONVERSATIONS_REQUEST });
    try {
      const res = await axios.get(`${API_URL}/api/chat/conversations`, {
        headers: authHeader(),
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          includeArchived: params.includeArchived || false,
          emergencyOnly: params.emergencyOnly || false,
        },
      });

      dispatch({
        type: types.FETCH_CONVERSATIONS_SUCCESS,
        payload: {
          conversations: res.data.conversations,
          pagination: res.data.pagination,
        },
      });

      return res.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Network error";

      dispatch({
        type: types.FETCH_CONVERSATIONS_ERROR,
        payload: { message: errorMessage },
      });

      return { error: true, message: errorMessage };
    }
  };

/**
 * Fetch messages for a specific conversation with pagination.
 * Loads the most recent 50 messages by default (Req 13.1).
 * Requirements: 13.1, 13.2
 */
export const fetchConversationMessages =
  (conversationId, params = {}) =>
  async (dispatch) => {
    dispatch({ type: types.FETCH_CONVERSATION_MESSAGES_REQUEST });
    try {
      const res = await axios.get(
        `${API_URL}/api/chat/conversations/${conversationId}`,
        {
          headers: authHeader(),
          params: {
            page: params.page || 1,
            limit: params.limit || 50,
          },
        }
      );

      dispatch({
        type: types.FETCH_CONVERSATION_MESSAGES_SUCCESS,
        payload: {
          conversationId,
          conversation: res.data.conversation,
          messages: res.data.messages,
          pagination: res.data.pagination,
        },
      });

      return res.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Network error";

      dispatch({
        type: types.FETCH_CONVERSATION_MESSAGES_ERROR,
        payload: { message: errorMessage },
      });

      return { error: true, message: errorMessage };
    }
  };

/**
 * Load an older page of messages for infinite scroll (Req 13.2).
 * Prepends results to the existing message list.
 */
export const loadMoreMessages =
  (conversationId, page) => async (dispatch) => {
    dispatch({ type: types.LOAD_MORE_MESSAGES_REQUEST });
    try {
      const res = await axios.get(
        `${API_URL}/api/chat/conversations/${conversationId}`,
        {
          headers: authHeader(),
          params: { page, limit: 50 },
        }
      );

      dispatch({
        type: types.LOAD_MORE_MESSAGES_SUCCESS,
        payload: {
          conversationId,
          messages: res.data.messages,
          pagination: res.data.pagination,
        },
      });

      return res.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Network error";

      dispatch({
        type: types.LOAD_MORE_MESSAGES_ERROR,
        payload: { message: errorMessage },
      });

      return { error: true, message: errorMessage };
    }
  };

/**
 * Create a new conversation between a doctor and patient.
 * Validates the active doctor-patient assignment on the backend (Req 3.3).
 */
export const createConversation =
  (doctorId, patientId) => async (dispatch) => {
    dispatch({ type: types.CREATE_CONVERSATION_REQUEST });
    try {
      const res = await axios.post(
        `${API_URL}/api/chat/conversations`,
        { doctorId, patientId },
        { headers: { ...authHeader(), "Content-Type": "application/json" } }
      );

      dispatch({
        type: types.CREATE_CONVERSATION_SUCCESS,
        payload: res.data.conversation,
      });

      return res.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Network error";

      dispatch({
        type: types.CREATE_CONVERSATION_ERROR,
        payload: { message: errorMessage },
      });

      return { error: true, message: errorMessage };
    }
  };

/**
 * Archive a conversation for the current user only (Req 9.1, 9.2).
 */
export const archiveConversation = (conversationId) => async (dispatch) => {
  dispatch({ type: types.ARCHIVE_CONVERSATION_REQUEST });
  try {
    const res = await axios.put(
      `${API_URL}/api/chat/conversations/${conversationId}/archive`,
      {},
      { headers: authHeader() }
    );

    dispatch({
      type: types.ARCHIVE_CONVERSATION_SUCCESS,
      payload: res.data.conversation,
    });

    return res.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || "Network error";

    dispatch({
      type: types.ARCHIVE_CONVERSATION_ERROR,
      payload: { message: errorMessage },
    });

    return { error: true, message: errorMessage };
  }
};

/**
 * Unarchive a conversation for the current user only (Req 9.4).
 */
export const unarchiveConversation = (conversationId) => async (dispatch) => {
  dispatch({ type: types.UNARCHIVE_CONVERSATION_REQUEST });
  try {
    const res = await axios.put(
      `${API_URL}/api/chat/conversations/${conversationId}/unarchive`,
      {},
      { headers: authHeader() }
    );

    dispatch({
      type: types.UNARCHIVE_CONVERSATION_SUCCESS,
      payload: res.data.conversation,
    });

    return res.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || "Network error";

    dispatch({
      type: types.UNARCHIVE_CONVERSATION_ERROR,
      payload: { message: errorMessage },
    });

    return { error: true, message: errorMessage };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Message Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send a message via Socket.io.
 *
 * Performs an optimistic dispatch so the UI updates immediately, then the
 * socket confirmation (SEND_MESSAGE_CONFIRM) or error (SEND_MESSAGE_ERROR)
 * reconciles the final state.
 *
 * @param {object} socket  - Active socket.io-client instance
 * @param {object} payload - { conversationId, content, attachmentIds?, isEmergency?, tempId }
 * Requirements: 1.1
 */
export const sendMessage = (socket, payload) => (dispatch) => {
  // Optimistic update – add a pending message to the UI immediately
  dispatch({
    type: types.SEND_MESSAGE,
    payload: {
      tempId: payload.tempId,
      conversationId: payload.conversationId,
      content: payload.content,
      attachments: payload.attachmentIds || [],
      isEmergency: payload.isEmergency || false,
    },
  });

  // Emit via Socket.io; the socket service will dispatch SEND_MESSAGE_CONFIRM
  // or SEND_MESSAGE_ERROR when the server responds.
  if (socket && socket.connected) {
    socket.emit("send_message", payload);
  } else {
    dispatch({
      type: types.SEND_MESSAGE_ERROR,
      payload: {
        tempId: payload.tempId,
        message: "Not connected to chat server. Message will be retried when reconnected.",
      },
    });
  }
};

/**
 * Dispatch when the socket server confirms a sent message.
 * Called by the socket service event listener, not directly by components.
 */
export const confirmSentMessage = (tempId, message) => ({
  type: types.SEND_MESSAGE_CONFIRM,
  payload: { tempId, message },
});

/**
 * Dispatch when a new message arrives via Socket.io.
 * Called by the socket service event listener.
 * Requirements: 1.4
 */
export const receiveMessage = (message, conversationId) => ({
  type: types.RECEIVE_MESSAGE,
  payload: { message, conversationId },
});

/**
 * Mark a message as read via REST API.
 * Also decrements the unread count for the conversation (Req 6.3, 11.2).
 */
export const markMessageAsRead = (messageId, conversationId) => async (dispatch) => {
  dispatch({ type: types.MARK_MESSAGE_READ_REQUEST });
  try {
    const res = await axios.put(
      `${API_URL}/api/chat/messages/${messageId}/read`,
      {},
      { headers: authHeader() }
    );

    dispatch({
      type: types.MARK_MESSAGE_READ_SUCCESS,
      payload: { message: res.data.message, conversationId },
    });

    // Keep unread count in sync
    dispatch({
      type: types.DECREMENT_UNREAD_COUNT,
      payload: { conversationId },
    });

    return res.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || "Network error";

    dispatch({
      type: types.MARK_MESSAGE_READ_ERROR,
      payload: { message: errorMessage },
    });

    return { error: true, message: errorMessage };
  }
};

/**
 * Soft-delete a message (sender only).
 * Requirements: 15.1
 */
export const deleteMessage = (messageId, conversationId) => async (dispatch) => {
  dispatch({ type: types.DELETE_MESSAGE_REQUEST });
  try {
    const res = await axios.delete(
      `${API_URL}/api/chat/messages/${messageId}`,
      { headers: authHeader() }
    );

    dispatch({
      type: types.DELETE_MESSAGE_SUCCESS,
      payload: { messageId, conversationId },
    });

    return res.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || "Network error";

    dispatch({
      type: types.DELETE_MESSAGE_ERROR,
      payload: { message: errorMessage },
    });

    return { error: true, message: errorMessage };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Socket Event Dispatchers
// (called by the socket service, not directly by UI components)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dispatch when a delivery receipt arrives via Socket.io (Req 6.2).
 */
export const messageDelivered = (messageId, conversationId) => ({
  type: types.MESSAGE_DELIVERED,
  payload: { messageId, conversationId },
});

/**
 * Dispatch when a read receipt arrives via Socket.io (Req 6.3, 6.4).
 */
export const messageRead = (messageId, conversationId, readAt) => ({
  type: types.MESSAGE_READ,
  payload: { messageId, conversationId, readAt },
});

/**
 * Dispatch when a message_deleted event arrives via Socket.io (Req 15.7).
 */
export const messageDeleted = (messageId, conversationId) => ({
  type: types.MESSAGE_DELETED,
  payload: { messageId, conversationId },
});

// ─────────────────────────────────────────────────────────────────────────────
// Typing Indicator Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update typing state for a participant in a conversation.
 * Dispatched by the socket service when typing_indicator events arrive (Req 5.1).
 *
 * @param {string}  conversationId
 * @param {string}  userId
 * @param {string}  userName
 * @param {boolean} isTyping
 */
export const updateTyping = (conversationId, userId, userName, isTyping) => ({
  type: types.UPDATE_TYPING,
  payload: { conversationId, userId, userName, isTyping },
});

// ─────────────────────────────────────────────────────────────────────────────
// Presence Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update the online/offline/away status of a user.
 * Dispatched by the socket service when user_online / user_offline events arrive (Req 7.4).
 *
 * @param {string} userId
 * @param {string} status  - 'online' | 'offline' | 'away'
 */
export const updatePresence = (userId, status) => ({
  type: types.UPDATE_PRESENCE,
  payload: { userId, status },
});

// ─────────────────────────────────────────────────────────────────────────────
// Unread Count Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch the total unread message count from the REST API (Req 11.6).
 */
export const fetchUnreadCount = () => async (dispatch) => {
  dispatch({ type: types.FETCH_UNREAD_COUNT_REQUEST });
  try {
    const res = await axios.get(`${API_URL}/api/chat/unread-count`, {
      headers: authHeader(),
    });

    dispatch({
      type: types.FETCH_UNREAD_COUNT_SUCCESS,
      payload: { unreadCount: res.data.unreadCount },
    });

    return res.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || "Network error";

    dispatch({
      type: types.FETCH_UNREAD_COUNT_ERROR,
      payload: { message: errorMessage },
    });

    return { error: true, message: errorMessage };
  }
};

/**
 * Increment unread count for a conversation (called on RECEIVE_MESSAGE).
 */
export const incrementUnreadCount = (conversationId) => ({
  type: types.INCREMENT_UNREAD_COUNT,
  payload: { conversationId },
});

/**
 * Reset unread count to zero for a conversation (e.g. when user opens it).
 */
export const resetUnreadCount = (conversationId) => ({
  type: types.RESET_UNREAD_COUNT,
  payload: { conversationId },
});

// ─────────────────────────────────────────────────────────────────────────────
// Message Search Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Search messages within a conversation (Req 8.1).
 *
 * @param {string} conversationId
 * @param {string} query  - min 2 chars, max 100 chars
 */
export const searchMessages = (conversationId, query) => async (dispatch) => {
  dispatch({ type: types.SEARCH_MESSAGES_REQUEST });
  try {
    const res = await axios.get(
      `${API_URL}/api/chat/conversations/${conversationId}/search`,
      {
        headers: authHeader(),
        params: { q: query },
      }
    );

    dispatch({
      type: types.SEARCH_MESSAGES_SUCCESS,
      payload: {
        messages: res.data.messages,
        query,
        count: res.data.count,
      },
    });

    return res.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || "Network error";

    dispatch({
      type: types.SEARCH_MESSAGES_ERROR,
      payload: { message: errorMessage },
    });

    return { error: true, message: errorMessage };
  }
};

/**
 * Clear search results (e.g. when closing the search panel).
 */
export const clearSearchResults = () => ({
  type: types.CLEAR_SEARCH_RESULTS,
});

// ─────────────────────────────────────────────────────────────────────────────
// Active Conversation Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Set the currently open conversation.
 * Also resets its unread count since the user is now viewing it.
 */
export const setActiveConversation = (conversationId) => (dispatch) => {
  dispatch({ type: types.SET_ACTIVE_CONVERSATION, payload: { conversationId } });
  if (conversationId) {
    dispatch(resetUnreadCount(conversationId));
  }
};

/**
 * Clear the active conversation (e.g. when navigating away from chat).
 */
export const clearActiveConversation = () => ({
  type: types.CLEAR_ACTIVE_CONVERSATION,
});

// ─────────────────────────────────────────────────────────────────────────────
// General Actions
// ─────────────────────────────────────────────────────────────────────────────

export const clearChatError = () => ({ type: types.CLEAR_CHAT_ERROR });

export const resetChatState = () => ({ type: types.RESET_CHAT_STATE });
