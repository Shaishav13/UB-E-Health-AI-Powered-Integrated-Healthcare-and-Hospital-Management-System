import { useState, useRef, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { FaPaperPlane, FaPaperclip } from 'react-icons/fa';
import { MdEmergency } from 'react-icons/md';
import { sendMessage } from '../../Redux/Chat/action';
import { emitTypingStart, emitTypingStop, getSocket } from '../../services/socketService';
import FileUpload from './FileUpload';

// Requirements: 1.1, 1.6, 4.1, 5.1, 5.4, 10.6, 24.2

const MAX_CHARS = 5000;
const TYPING_STOP_DELAY = 3000; // ms of inactivity before typing_stop is emitted
const MAX_ATTACHMENTS = 5;

/**
 * Generate a temporary ID for optimistic message updates.
 */
function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * MessageInput — text input, file picker, emergency flag, and send button.
 *
 * Props:
 *   conversationId  — string, the active conversation ID
 *   currentUser     — { _id, userType, name }
 */
const MessageInput = ({ conversationId, currentUser }) => {
  const dispatch = useDispatch();

  // ── Local state ────────────────────────────────────────────────────────────
  const [content, setContent] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFileIds, setUploadedFileIds] = useState([]); // fileIds returned by upload API
  const [uploadCount, setUploadCount] = useState(0); // track how many files are attached
  const [isTypingActive, setIsTypingActive] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const textareaRef = useRef(null);
  const typingTimerRef = useRef(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isEmpty = content.trim().length === 0 && uploadedFileIds.length === 0;
  const canSend = !isEmpty && !isOverLimit;
  const isPatient = currentUser?.userType === 'patient';

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(typingTimerRef.current);
      if (isTypingActive && conversationId) {
        emitTypingStop(conversationId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Typing indicator logic ─────────────────────────────────────────────────
  const handleTypingStart = useCallback(() => {
    if (!conversationId) return;

    if (!isTypingActive) {
      emitTypingStart(conversationId);
      setIsTypingActive(true);
    }

    // Reset the stop timer on every keystroke
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      emitTypingStop(conversationId);
      setIsTypingActive(false);
    }, TYPING_STOP_DELAY);
  }, [conversationId, isTypingActive]);

  const stopTyping = useCallback(() => {
    clearTimeout(typingTimerRef.current);
    if (isTypingActive && conversationId) {
      emitTypingStop(conversationId);
      setIsTypingActive(false);
    }
  }, [conversationId, isTypingActive]);

  // ── Text change ────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setContent(e.target.value);
    handleTypingStart();

    // Auto-resize textarea
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
    }
  };

  // ── File upload callbacks ──────────────────────────────────────────────────
  const handleUploadComplete = useCallback((fileData) => {
    // fileData: { fileId, fileUrl, thumbnailUrl, fileName, fileType, fileSize }
    setUploadedFileIds((prev) => [...prev, fileData.fileId]);
    setUploadCount((prev) => prev + 1);
  }, []);

  const handleUploadError = useCallback((_errorMsg) => {
    // Error is displayed inside the FileUpload component itself
  }, []);

  const handleUploadRemove = useCallback((fileId) => {
    setUploadedFileIds((prev) => prev.filter((id) => id !== fileId));
    setUploadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!canSend || !conversationId) return;

    stopTyping();

    const tempId = generateTempId();
    const socket = getSocket();

    dispatch(
      sendMessage(socket, {
        conversationId,
        content: content.trim(),
        attachmentIds: uploadedFileIds,
        isEmergency: isPatient ? isEmergency : false,
        tempId,
      })
    );

    // Reset state
    setContent('');
    setIsEmergency(false);
    setUploadedFileIds([]);
    setUploadCount(0);
    setShowFileUpload(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  }, [canSend, conversationId, content, isEmergency, isPatient, uploadedFileIds, dispatch, stopTyping]);

  // ── Keyboard handler ───────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    // Enter sends; Shift+Enter inserts newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Char count colour ──────────────────────────────────────────────────────
  const charCountClass = isOverLimit
    ? 'msg-input-char-count over-limit'
    : charCount > MAX_CHARS * 0.9
    ? 'msg-input-char-count near-limit'
    : 'msg-input-char-count';

  return (
    <div className="msg-input-container">
      {/* FileUpload widget — shown when user clicks the paperclip */}
      {showFileUpload && (
        <div className="msg-input-file-upload-panel">
          <FileUpload
            conversationId={conversationId}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            onRemove={handleUploadRemove}
            maxFiles={MAX_ATTACHMENTS}
          />
        </div>
      )}

      {/* Emergency checkbox — patients only (Req 10.6) */}
      {isPatient && (
        <div className="msg-input-emergency-row">
          <label className="msg-input-emergency-label">
            <input
              type="checkbox"
              checked={isEmergency}
              onChange={(e) => setIsEmergency(e.target.checked)}
              className="msg-input-emergency-checkbox"
              aria-label="Flag as emergency"
            />
            <MdEmergency size={14} className={isEmergency ? 'emergency-icon active' : 'emergency-icon'} />
            <span className={isEmergency ? 'emergency-text active' : 'emergency-text'}>
              Flag as emergency
            </span>
          </label>
        </div>
      )}

      {/* Input row */}
      <div className={`msg-input-row${isEmergency ? ' emergency-mode' : ''}`}>
        {/* File attachment button — toggles the FileUpload panel */}
        <button
          className={`msg-input-attach-btn${showFileUpload ? ' active' : ''}`}
          onClick={() => setShowFileUpload((v) => !v)}
          disabled={uploadCount >= MAX_ATTACHMENTS}
          title={showFileUpload ? 'Hide file upload' : 'Attach file'}
          aria-label={showFileUpload ? 'Hide file upload' : 'Attach file'}
          aria-expanded={showFileUpload}
          type="button"
        >
          <FaPaperclip size={16} />
        </button>

        {/* Textarea */}
        <div className="msg-input-textarea-wrapper">
          <textarea
            ref={textareaRef}
            className={`msg-input-textarea${isOverLimit ? ' over-limit' : ''}`}
            placeholder="Type a message…"
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={MAX_CHARS + 100} // allow slight over-typing so user sees the error
            aria-label="Message input"
            aria-describedby="msg-char-count"
          />
          <span id="msg-char-count" className={charCountClass} aria-live="polite">
            {charCount}/{MAX_CHARS}
          </span>
        </div>

        {/* Send button */}
        <button
          className={`msg-input-send-btn${canSend ? ' active' : ''}`}
          onClick={handleSend}
          disabled={!canSend}
          title="Send message"
          aria-label="Send message"
          type="button"
        >
          <FaPaperPlane size={15} />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
