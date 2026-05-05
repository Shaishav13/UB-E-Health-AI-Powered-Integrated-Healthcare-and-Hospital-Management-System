import { FaUserMd, FaUser } from 'react-icons/fa';
import { MdEmergency } from 'react-icons/md';

// Requirements: 14.3, 14.4, 14.5, 7.7, 10.5, 11.5

/**
 * Format a date into a human-readable relative time string.
 * No external libraries — pure JS.
 * @param {string|Date} date
 * @returns {string}
 */
function formatRelativeTime(date) {
  if (!date) return '';
  const now = new Date();
  const then = new Date(date);
  if (isNaN(then.getTime())) return '';

  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;

  // Older than a week — show short date
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Resolve a participant field that may be a populated object or a plain string ID.
 * Returns { _id, name, profilePicture } or a safe fallback.
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
  // Plain string ID — no name available
  return { _id: field, name: 'Unknown', profilePicture: null };
}

/**
 * Get the "other" participant relative to the current user.
 */
function getOtherParticipant(conversation, currentUser) {
  if (!conversation || !currentUser) {
    return { _id: '', name: 'Unknown', profilePicture: null, role: 'Patient' };
  }

  if (currentUser.userType === 'doctor') {
    return { ...resolveParticipant(conversation.patientId), role: 'Patient' };
  }
  return { ...resolveParticipant(conversation.doctorId), role: 'Doctor' };
}

/**
 * Build the last message preview string.
 */
function buildPreview(lastMessage) {
  if (!lastMessage) return 'No messages yet';
  const { type, content } = lastMessage;
  if (type === 'file' || type === 'image') return '📎 Attachment';
  if (!content) return 'No messages yet';
  return content.length > 50 ? content.slice(0, 50) + '…' : content;
}

/**
 * Format unread count for display — cap at 99+.
 */
function formatUnread(count) {
  if (!count || count <= 0) return null;
  return count > 99 ? '99+' : String(count);
}

/**
 * ConversationListItem — pure presentational component.
 *
 * Props:
 *   conversation   — conversation object
 *   currentUser    — { _id, userType, name }
 *   presence       — { [userId]: 'online'|'offline'|'away' }
 *   isActive       — boolean
 *   onClick        — function
 */
const ConversationListItem = ({ conversation, currentUser, presence, isActive, onClick }) => {
  if (!conversation) return null;

  const other = getOtherParticipant(conversation, currentUser);

  // Unread count — prefer role-specific field, fall back to _localUnread
  let unreadCount = 0;
  if (currentUser?.userType === 'doctor') {
    unreadCount =
      conversation.unreadCount?.doctor ??
      conversation._localUnread ??
      0;
  } else {
    unreadCount =
      conversation.unreadCount?.patient ??
      conversation._localUnread ??
      0;
  }

  const unreadDisplay = formatUnread(unreadCount);
  const preview = buildPreview(conversation.lastMessage);
  const timestamp = conversation.lastMessage?.timestamp ||
    conversation.metadata?.lastActivityAt ||
    conversation.updatedAt;
  const relativeTime = formatRelativeTime(timestamp);

  // Presence status for the other participant
  const presenceStatus = (presence && other._id) ? (presence[other._id] || 'offline') : 'offline';

  // Avatar: first letter of name
  const avatarLetter = other.name ? other.name.charAt(0).toUpperCase() : '?';

  const itemClasses = [
    'conversation-item',
    isActive ? 'active' : '',
    conversation.isEmergency ? 'emergency' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={itemClasses} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}>

      {/* Avatar */}
      <div className={`conversation-avatar conversation-avatar-${presenceStatus}`}>
        {other.profilePicture ? (
          <img src={other.profilePicture} alt={other.name} />
        ) : (
          <span className="conversation-avatar-letter">{avatarLetter}</span>
        )}
        <span className={`conversation-status-dot status-${presenceStatus}`} aria-label={presenceStatus} />
      </div>

      {/* Content */}
      <div className="conversation-item-content">
        <div className="conversation-item-name">
          <span className="conversation-participant-name">{other.name}</span>
          <span className={`conversation-role-badge role-${other.role.toLowerCase()}`}>
            {other.role === 'Doctor' ? <FaUserMd size={10} /> : <FaUser size={10} />}
            {' '}{other.role}
          </span>
          {conversation.isEmergency && (
            <span className="conversation-emergency-flag" title="Emergency">
              <MdEmergency size={14} />
            </span>
          )}
        </div>

        <div className="conversation-item-preview">{preview}</div>

        <div className="conversation-item-meta">
          <span className="conversation-item-time">{relativeTime}</span>
          {unreadDisplay && (
            <span className="conversation-unread-badge">{unreadDisplay}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationListItem;
