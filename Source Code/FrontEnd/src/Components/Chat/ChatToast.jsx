/**
 * ChatToast — centralised toast notification helper for the chat system.
 *
 * Wraps react-toastify with chat-specific severity categories so all
 * error/warning/info messages are displayed consistently.
 *
 * Requirements: 23.6
 *
 * Usage:
 *   import { chatToast } from './ChatToast';
 *   chatToast.error('Something went wrong');
 *   chatToast.warn('Approaching rate limit');
 *   chatToast.info('Reconnecting…');
 *   chatToast.success('Message sent');
 *
 * The <ChatToastContainer /> must be rendered once in the app tree
 * (already added to App.js).
 */

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ─────────────────────────────────────────────────────────────────────────────
// Shared toast options
// ─────────────────────────────────────────────────────────────────────────────

const BASE_OPTIONS = {
  position: 'bottom-right',
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
};

const DURATIONS = {
  info: 3000,
  success: 3000,
  warn: 5000,
  error: 6000,
};

// ─────────────────────────────────────────────────────────────────────────────
// chatToast API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Display an informational toast (blue).
 * @param {string} message
 * @param {object} [options] - react-toastify options override
 */
function info(message, options = {}) {
  toast.info(message, { ...BASE_OPTIONS, autoClose: DURATIONS.info, ...options });
}

/**
 * Display a success toast (green).
 * @param {string} message
 * @param {object} [options]
 */
function success(message, options = {}) {
  toast.success(message, { ...BASE_OPTIONS, autoClose: DURATIONS.success, ...options });
}

/**
 * Display a warning toast (orange).
 * @param {string} message
 * @param {object} [options]
 */
function warn(message, options = {}) {
  toast.warn(message, { ...BASE_OPTIONS, autoClose: DURATIONS.warn, ...options });
}

/**
 * Display an error toast (red).
 * @param {string} message
 * @param {object} [options]
 */
function error(message, options = {}) {
  toast.error(message, { ...BASE_OPTIONS, autoClose: DURATIONS.error, ...options });
}

/**
 * Display a rate-limit warning with a countdown.
 * @param {number} resetInSeconds - seconds until the rate limit resets
 */
function rateLimitWarning(resetInSeconds) {
  const minutes = Math.ceil(resetInSeconds / 60);
  const label = minutes > 1 ? `${minutes} minutes` : `${resetInSeconds} seconds`;
  warn(`Message limit reached. You can send again in ${label}.`, {
    autoClose: Math.min(resetInSeconds * 1000, 10000),
    toastId: 'rate-limit', // prevent duplicate toasts
  });
}

/**
 * Display a connection-status toast.
 * @param {'connecting'|'connected'|'disconnected'|'failed'} status
 * @param {number} [attempt] - reconnect attempt number (for 'connecting')
 */
function connectionStatus(status, attempt) {
  const toastId = 'connection-status';

  switch (status) {
    case 'connecting':
      info(
        attempt
          ? `Reconnecting… (attempt ${attempt})`
          : 'Connecting to chat server…',
        { toastId, autoClose: false }
      );
      break;
    case 'connected':
      toast.dismiss(toastId);
      success('Connected to chat server.', { toastId: 'connected', autoClose: 2000 });
      break;
    case 'disconnected':
      warn('Disconnected from chat server. Attempting to reconnect…', {
        toastId,
        autoClose: false,
      });
      break;
    case 'failed':
      error(
        'Could not reconnect to chat server. Please check your internet connection.',
        { toastId, autoClose: false }
      );
      break;
    default:
      break;
  }
}

export const chatToast = { info, success, warn, error, rateLimitWarning, connectionStatus };

// ─────────────────────────────────────────────────────────────────────────────
// ChatToastContainer — render once in App.js
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Drop-in ToastContainer pre-configured for the chat system.
 * Render this once near the root of the app.
 */
export function ChatToastContainer() {
  return (
    <ToastContainer
      position="bottom-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable={false}
      pauseOnHover
      theme="light"
      limit={5}
    />
  );
}
