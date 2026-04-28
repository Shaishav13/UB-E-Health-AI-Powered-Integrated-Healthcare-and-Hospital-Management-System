// Chat Action Types
// Requirements: 1.1, 5.1, 7.4, 11.1

// ── Conversations ─────────────────────────────────────────────────────────────

export const FETCH_CONVERSATIONS_REQUEST = "FETCH_CONVERSATIONS_REQUEST";
export const FETCH_CONVERSATIONS_SUCCESS = "FETCH_CONVERSATIONS_SUCCESS";
export const FETCH_CONVERSATIONS_ERROR   = "FETCH_CONVERSATIONS_ERROR";

export const FETCH_CONVERSATION_MESSAGES_REQUEST = "FETCH_CONVERSATION_MESSAGES_REQUEST";
export const FETCH_CONVERSATION_MESSAGES_SUCCESS = "FETCH_CONVERSATION_MESSAGES_SUCCESS";
export const FETCH_CONVERSATION_MESSAGES_ERROR   = "FETCH_CONVERSATION_MESSAGES_ERROR";

export const CREATE_CONVERSATION_REQUEST = "CREATE_CONVERSATION_REQUEST";
export const CREATE_CONVERSATION_SUCCESS = "CREATE_CONVERSATION_SUCCESS";
export const CREATE_CONVERSATION_ERROR   = "CREATE_CONVERSATION_ERROR";

export const ARCHIVE_CONVERSATION_REQUEST = "ARCHIVE_CONVERSATION_REQUEST";
export const ARCHIVE_CONVERSATION_SUCCESS = "ARCHIVE_CONVERSATION_SUCCESS";
export const ARCHIVE_CONVERSATION_ERROR   = "ARCHIVE_CONVERSATION_ERROR";

export const UNARCHIVE_CONVERSATION_REQUEST = "UNARCHIVE_CONVERSATION_REQUEST";
export const UNARCHIVE_CONVERSATION_SUCCESS = "UNARCHIVE_CONVERSATION_SUCCESS";
export const UNARCHIVE_CONVERSATION_ERROR   = "UNARCHIVE_CONVERSATION_ERROR";

// ── Messages ──────────────────────────────────────────────────────────────────

// Outbound message sent via Socket.io (optimistic add before confirmation)
export const SEND_MESSAGE         = "SEND_MESSAGE";
export const SEND_MESSAGE_CONFIRM = "SEND_MESSAGE_CONFIRM";  // server confirmed
export const SEND_MESSAGE_ERROR   = "SEND_MESSAGE_ERROR";

// Inbound message received via Socket.io
export const RECEIVE_MESSAGE = "RECEIVE_MESSAGE";

export const MARK_MESSAGE_READ_REQUEST = "MARK_MESSAGE_READ_REQUEST";
export const MARK_MESSAGE_READ_SUCCESS = "MARK_MESSAGE_READ_SUCCESS";
export const MARK_MESSAGE_READ_ERROR   = "MARK_MESSAGE_READ_ERROR";

export const DELETE_MESSAGE_REQUEST = "DELETE_MESSAGE_REQUEST";
export const DELETE_MESSAGE_SUCCESS = "DELETE_MESSAGE_SUCCESS";
export const DELETE_MESSAGE_ERROR   = "DELETE_MESSAGE_ERROR";

// Delivery / read receipt events from Socket.io
export const MESSAGE_DELIVERED = "MESSAGE_DELIVERED";
export const MESSAGE_READ      = "MESSAGE_READ";
export const MESSAGE_DELETED   = "MESSAGE_DELETED";

// ── Message Search ────────────────────────────────────────────────────────────

export const SEARCH_MESSAGES_REQUEST = "SEARCH_MESSAGES_REQUEST";
export const SEARCH_MESSAGES_SUCCESS = "SEARCH_MESSAGES_SUCCESS";
export const SEARCH_MESSAGES_ERROR   = "SEARCH_MESSAGES_ERROR";
export const CLEAR_SEARCH_RESULTS    = "CLEAR_SEARCH_RESULTS";

// ── Typing Indicators ─────────────────────────────────────────────────────────

export const UPDATE_TYPING = "UPDATE_TYPING";  // { conversationId, userId, userName, isTyping }

// ── User Presence ─────────────────────────────────────────────────────────────

export const UPDATE_PRESENCE = "UPDATE_PRESENCE";  // { userId, status: 'online'|'offline'|'away' }

// ── Unread Counts ─────────────────────────────────────────────────────────────

export const FETCH_UNREAD_COUNT_REQUEST = "FETCH_UNREAD_COUNT_REQUEST";
export const FETCH_UNREAD_COUNT_SUCCESS = "FETCH_UNREAD_COUNT_SUCCESS";
export const FETCH_UNREAD_COUNT_ERROR   = "FETCH_UNREAD_COUNT_ERROR";

// Incremented/decremented in real-time by socket events
export const INCREMENT_UNREAD_COUNT = "INCREMENT_UNREAD_COUNT";  // { conversationId }
export const DECREMENT_UNREAD_COUNT = "DECREMENT_UNREAD_COUNT";  // { conversationId }
export const RESET_UNREAD_COUNT     = "RESET_UNREAD_COUNT";      // { conversationId }

// ── Active Conversation ───────────────────────────────────────────────────────

export const SET_ACTIVE_CONVERSATION   = "SET_ACTIVE_CONVERSATION";
export const CLEAR_ACTIVE_CONVERSATION = "CLEAR_ACTIVE_CONVERSATION";

// ── Load More (pagination) ────────────────────────────────────────────────────

export const LOAD_MORE_MESSAGES_REQUEST = "LOAD_MORE_MESSAGES_REQUEST";
export const LOAD_MORE_MESSAGES_SUCCESS = "LOAD_MORE_MESSAGES_SUCCESS";
export const LOAD_MORE_MESSAGES_ERROR   = "LOAD_MORE_MESSAGES_ERROR";

// ── General ───────────────────────────────────────────────────────────────────

export const CLEAR_CHAT_ERROR = "CLEAR_CHAT_ERROR";
export const RESET_CHAT_STATE = "RESET_CHAT_STATE";
