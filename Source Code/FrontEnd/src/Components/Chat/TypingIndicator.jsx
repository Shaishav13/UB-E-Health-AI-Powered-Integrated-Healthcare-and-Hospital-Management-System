import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateTyping } from '../../Redux/Chat/action';

// Requirements: 5.1, 5.2, 5.6

const AUTO_HIDE_DELAY = 5000; // ms — auto-hide if no typing_stop event arrives

/**
 * Build a human-readable label for who is typing.
 * e.g. "Dr. Smith is typing…" or "Dr. Smith and 2 others are typing…"
 */
function buildTypingLabel(typingUsers) {
  if (!typingUsers || typingUsers.length === 0) return '';
  if (typingUsers.length === 1) {
    return `${typingUsers[0].userName} is typing`;
  }
  if (typingUsers.length === 2) {
    return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing`;
  }
  return `${typingUsers[0].userName} and ${typingUsers.length - 1} others are typing`;
}

/**
 * TypingIndicator — animated "…is typing" indicator.
 *
 * Props:
 *   typingUsers     — array of { userId, userName, isTyping, timestamp }
 *   conversationId  — string, used to clear stale indicators
 */
const TypingIndicator = ({ typingUsers, conversationId }) => {
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(true);

  // ── Auto-hide after 5 seconds if no typing_stop event (Req 5.6) ───────────
  useEffect(() => {
    if (!typingUsers || typingUsers.length === 0) {
      setVisible(false);
      return;
    }

    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
      // Clear stale typing indicators from Redux state
      typingUsers.forEach(({ userId }) => {
        dispatch(updateTyping(conversationId, userId, '', false));
      });
    }, AUTO_HIDE_DELAY);

    return () => clearTimeout(timer);
  }, [typingUsers, conversationId, dispatch]);

  if (!visible || !typingUsers || typingUsers.length === 0) return null;

  const label = buildTypingLabel(typingUsers);

  return (
    <div className="typing-indicator" role="status" aria-live="polite" aria-label={label}>
      {/* Animated dots */}
      <div className="typing-indicator-dots" aria-hidden="true">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span className="typing-indicator-text">{label}…</span>
    </div>
  );
};

export default TypingIndicator;
