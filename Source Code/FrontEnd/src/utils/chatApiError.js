/**
 * chatApiError — centralised API error handling for the chat system.
 *
 * Translates HTTP error responses into user-friendly messages and triggers
 * appropriate side-effects (toasts, redirects) without leaking technical
 * details to the user.
 *
 * Requirements: 12.3, 12.4, 23.6
 */

import { chatToast } from '../Components/Chat/ChatToast';

// ─────────────────────────────────────────────────────────────────────────────
// Error message map
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map HTTP status codes to user-friendly messages.
 * Falls back to the server's message if available, then to a generic string.
 */
const STATUS_MESSAGES = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Your session has expired. Please log in again.',
  403: "You don't have permission to perform this action.",
  404: 'The requested resource was not found.',
  409: 'A conflict occurred. The resource may already exist.',
  413: 'The file or data you are trying to send is too large.',
  422: 'Validation failed. Please check your input.',
  429: 'Too many requests. Please wait before trying again.',
  500: 'A server error occurred. Please try again later.',
  502: 'The server is temporarily unavailable. Please try again later.',
  503: 'The service is currently unavailable. Please try again later.',
};

// ─────────────────────────────────────────────────────────────────────────────
// Retry helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retry an async function up to `maxAttempts` times with exponential backoff.
 *
 * @param {() => Promise<any>} fn - The async function to retry.
 * @param {object} [options]
 * @param {number} [options.maxAttempts=3] - Maximum number of attempts.
 * @param {number} [options.baseDelay=500]  - Base delay in ms (doubles each attempt).
 * @param {(err: any) => boolean} [options.shouldRetry] - Return false to abort early.
 * @returns {Promise<any>}
 */
export async function withRetry(fn, options = {}) {
  const { maxAttempts = 3, baseDelay = 500, shouldRetry } = options;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Don't retry client errors (4xx) except network errors and 429
      const status = err?.response?.status;
      if (status && status !== 429 && status >= 400 && status < 500) {
        break;
      }

      // Custom abort condition
      if (shouldRetry && !shouldRetry(err)) {
        break;
      }

      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main error handler
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle an Axios error from a chat API call.
 *
 * - Shows a user-friendly toast (Req 23.6)
 * - Handles rate-limit (429) with countdown (Req 12.3, 12.4)
 * - Handles unauthorized (401) with redirect
 * - Handles forbidden (403) with a clear message
 * - Returns a normalised error object for callers that need it
 *
 * @param {any} err - The caught error (Axios error or generic Error)
 * @param {object} [options]
 * @param {boolean} [options.silent=false] - Suppress toast if true
 * @param {string}  [options.context]      - Optional context label for logging
 * @returns {{ message: string, status: number|null, isNetworkError: boolean }}
 */
export function handleChatApiError(err, options = {}) {
  const { silent = false, context = 'Chat API' } = options;

  const status = err?.response?.status ?? null;
  const serverMessage = err?.response?.data?.message;
  const isNetworkError = !err?.response && !!err?.request;

  // Build a user-friendly message
  let userMessage;

  if (isNetworkError) {
    userMessage = 'Network error. Please check your internet connection.';
  } else if (status) {
    // Prefer the server's message for validation errors (400, 422)
    if ((status === 400 || status === 422) && serverMessage) {
      userMessage = serverMessage;
    } else {
      userMessage = STATUS_MESSAGES[status] || serverMessage || 'An unexpected error occurred.';
    }
  } else {
    userMessage = serverMessage || err?.message || 'An unexpected error occurred.';
  }

  // Log for debugging (never expose raw error to user)
  console.error(`[${context}]`, { status, message: err?.message, serverMessage });

  if (!silent) {
    if (status === 429) {
      // Extract reset time from headers if available
      const retryAfter = parseInt(err?.response?.headers?.['retry-after'] || '60', 10);
      chatToast.rateLimitWarning(retryAfter);
    } else if (status === 401) {
      chatToast.error('Your session has expired. Please log in again.');
      // Redirect to login after a short delay so the user can read the toast
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } else if (status === 403) {
      chatToast.error(userMessage);
    } else if (isNetworkError) {
      chatToast.warn(userMessage);
    } else {
      chatToast.error(userMessage);
    }
  }

  return { message: userMessage, status, isNetworkError };
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience wrapper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wrap an async API call with automatic error handling and optional retry.
 *
 * @param {() => Promise<any>} apiFn - The async API call.
 * @param {object} [options]
 * @param {boolean} [options.retry=false]   - Retry on network/server errors.
 * @param {boolean} [options.silent=false]  - Suppress toast notifications.
 * @param {string}  [options.context]       - Label for error logging.
 * @returns {Promise<{ data: any, error: object|null }>}
 */
export async function safeChatApiCall(apiFn, options = {}) {
  const { retry = false, silent = false, context } = options;

  try {
    const data = retry
      ? await withRetry(apiFn, { maxAttempts: 3 })
      : await apiFn();
    return { data, error: null };
  } catch (err) {
    const error = handleChatApiError(err, { silent, context });
    return { data: null, error };
  }
}
