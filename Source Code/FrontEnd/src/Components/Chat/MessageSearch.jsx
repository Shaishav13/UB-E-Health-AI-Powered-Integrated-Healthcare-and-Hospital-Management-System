import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaSearch, FaTimes, FaSpinner } from 'react-icons/fa';
import { searchMessages, clearSearchResults } from '../../Redux/Chat/action';
import './MessageSearch.css';

// Requirements: 8.1, 8.2, 8.4, 8.8, 17.2

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Escape HTML entities in a plain-text string to prevent XSS when injecting
 * into innerHTML / dangerouslySetInnerHTML (Req 17.2).
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Escape regex special characters in a string to prevent ReDoS (Req 8.4).
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Highlight all occurrences of `query` inside `text` using <mark> tags.
 * Both the text content and the query are sanitized before use.
 *
 * @param {string} text  - raw message content
 * @param {string} query - search term
 * @returns {string}     - safe HTML string with <mark class="search-highlight"> wrapping matches
 */
export function highlightText(text, query) {
  if (!text || !query) return escapeHtml(text || '');

  const safeText = escapeHtml(text);
  const safeQuery = escapeRegex(query.trim());

  if (!safeQuery) return safeText;

  try {
    const regex = new RegExp(`(${safeQuery})`, 'gi');
    return safeText.replace(regex, '<mark class="search-highlight">$1</mark>');
  } catch {
    // Fallback: return escaped text without highlighting
    return safeText;
  }
}

/**
 * Format a date string into "MMM D, HH:MM" (e.g. "Apr 28, 14:32").
 */
function formatSearchTimestamp(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const datePart = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timePart = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${datePart}, ${timePart}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MessageSearch component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * MessageSearch — search panel rendered inside ChatWindow.
 *
 * Props:
 *   conversationId  — active conversation ID
 *   onClose         — called when the user closes the panel
 *   onResultClick   — called with messageId when a result is clicked
 */
const MessageSearch = ({ conversationId, onClose, onResultClick }) => {
  const dispatch = useDispatch();

  const { searchResults, searchQuery, searchLoading } = useSelector(
    (state) => state.chat
  );

  const [inputValue, setInputValue] = useState('');
  const [validationError, setValidationError] = useState('');
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Clear results on unmount (Req 8.8)
  useEffect(() => {
    return () => {
      dispatch(clearSearchResults());
    };
  }, [dispatch]);

  // ── Debounced search ───────────────────────────────────────────────────────
  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setInputValue(value);

      // Clear any pending debounce
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (value.length === 0) {
        setValidationError('');
        dispatch(clearSearchResults());
        return;
      }

      if (value.length < 2) {
        setValidationError('Enter at least 2 characters to search.');
        dispatch(clearSearchResults());
        return;
      }

      setValidationError('');

      // Debounce 500ms (Req 8.1)
      debounceRef.current = setTimeout(() => {
        dispatch(searchMessages(conversationId, value));
      }, 500);
    },
    [conversationId, dispatch]
  );

  // ── Clear / close ──────────────────────────────────────────────────────────
  const handleClear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setInputValue('');
    setValidationError('');
    dispatch(clearSearchResults());
    onClose();
  };

  // ── Result click ───────────────────────────────────────────────────────────
  const handleResultClick = (messageId) => {
    onResultClick?.(messageId);
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  const showResults = !searchLoading && searchResults.length > 0;
  const showEmpty =
    !searchLoading &&
    searchResults.length === 0 &&
    searchQuery.length >= 2 &&
    inputValue.length >= 2 &&
    !validationError;

  return (
    <div className="msg-search-panel" role="search" aria-label="Search messages">
      {/* ── Search input row ─────────────────────────────────────────────── */}
      <div className="msg-search-input-row">
        <FaSearch className="msg-search-icon" size={14} aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          className="msg-search-input"
          placeholder="Search messages…"
          value={inputValue}
          onChange={handleInputChange}
          aria-label="Search messages"
          autoComplete="off"
          spellCheck={false}
        />
        {searchLoading && (
          <FaSpinner className="msg-search-spinner" size={14} aria-label="Searching…" />
        )}
        <button
          className="msg-search-clear-btn"
          onClick={handleClear}
          aria-label="Close search"
          title="Close search"
        >
          <FaTimes size={14} />
        </button>
      </div>

      {/* ── Validation error ─────────────────────────────────────────────── */}
      {validationError && (
        <p className="msg-search-validation-error" role="alert">
          {validationError}
        </p>
      )}

      {/* ── Results list ─────────────────────────────────────────────────── */}
      {showResults && (
        <ul className="msg-search-results" role="listbox" aria-label="Search results">
          {searchResults.map((message) => {
            const senderName =
              message.senderName ||
              (typeof message.senderId === 'object' ? message.senderId?.name : '') ||
              'Unknown';

            const role = message.senderModel || 'Patient';
            const hasContent = Boolean(message.content);
            const hasAttachments =
              Array.isArray(message.attachments) && message.attachments.length > 0;

            const highlightedContent = hasContent
              ? highlightText(message.content, inputValue || searchQuery)
              : null;

            return (
              <li
                key={message._id}
                className="msg-search-result-item"
                role="option"
                aria-selected="false"
                onClick={() => handleResultClick(message._id)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleResultClick(message._id);
                  }
                }}
              >
                {/* Sender + timestamp row */}
                <div className="msg-search-result-meta">
                  <span className="msg-search-sender-name">{senderName}</span>
                  <span
                    className={`msg-search-role-badge role-${role.toLowerCase()}`}
                    aria-label={role}
                  >
                    {role}
                  </span>
                  <span className="msg-search-timestamp">
                    {formatSearchTimestamp(message.createdAt)}
                  </span>
                </div>

                {/* Message preview */}
                <div className="msg-search-result-preview">
                  {hasContent ? (
                    <span
                      // Safe: content is HTML-escaped before mark tags are inserted
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{ __html: highlightedContent }}
                    />
                  ) : hasAttachments ? (
                    <span className="msg-search-attachment-hint">📎 Attachment</span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {showEmpty && (
        <div className="msg-search-empty" role="status" aria-live="polite">
          No messages found for &ldquo;{inputValue || searchQuery}&rdquo;
        </div>
      )}
    </div>
  );
};

export default MessageSearch;
