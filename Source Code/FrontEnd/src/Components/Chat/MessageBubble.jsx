import { useState } from 'react';
import {
  FaCheck,
  FaCheckDouble,
  FaExclamationTriangle,
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaDownload,
  FaTrash,
} from 'react-icons/fa';
import { MdEmergency } from 'react-icons/md';
import { useDispatch } from 'react-redux';
import { deleteMessage } from '../../Redux/Chat/action';

// Requirements: 1.4, 4.9, 6.1, 6.2, 6.3, 10.5, 15.4

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format a timestamp into a short time string (e.g. "14:32").
 */
function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format file size in human-readable form.
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Pick the right icon for a file type.
 */
function FileIcon({ fileType, size = 20 }) {
  const type = (fileType || '').toLowerCase();
  if (type.includes('pdf')) return <FaFilePdf size={size} className="file-icon-pdf" />;
  if (type.includes('word') || type.includes('doc')) return <FaFileWord size={size} className="file-icon-word" />;
  return <FaFileAlt size={size} className="file-icon-generic" />;
}

/**
 * Determine if a file is an image based on its MIME type or file name.
 */
function isImageFile(attachment) {
  const type = (attachment.fileType || attachment.mimeType || '').toLowerCase();
  const name = (attachment.fileName || '').toLowerCase();
  return (
    type.startsWith('image/') ||
    /\.(jpg|jpeg|png|gif|webp)$/.test(name)
  );
}

/**
 * Resolve the sender ID from a message (handles populated objects and plain strings).
 */
function resolveSenderId(senderId) {
  if (!senderId) return '';
  if (typeof senderId === 'object') return senderId._id || '';
  return senderId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status indicator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shows sent / delivered / read tick icons.
 * Requirements: 6.1, 6.2, 6.3
 */
function MessageStatus({ status, isPending, isFailed }) {
  if (isFailed) {
    return (
      <span className="msg-status msg-status-failed" title="Failed to send">
        <FaExclamationTriangle size={10} />
      </span>
    );
  }
  if (isPending) {
    return (
      <span className="msg-status msg-status-pending" title="Sending…">
        <FaCheck size={10} />
      </span>
    );
  }
  if (!status) return null;

  if (status.read) {
    return (
      <span className="msg-status msg-status-read" title="Read">
        <FaCheckDouble size={11} />
      </span>
    );
  }
  if (status.delivered) {
    return (
      <span className="msg-status msg-status-delivered" title="Delivered">
        <FaCheckDouble size={11} />
      </span>
    );
  }
  if (status.sent) {
    return (
      <span className="msg-status msg-status-sent" title="Sent">
        <FaCheck size={10} />
      </span>
    );
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Attachment renderer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders a single file attachment — image thumbnail or file card.
 * Requirements: 4.9
 */
function AttachmentItem({ attachment }) {
  const [imgError, setImgError] = useState(false);
  const isImage = isImageFile(attachment) && !imgError;
  const downloadUrl = attachment.fileUrl || attachment.thumbnailUrl;

  return (
    <div className="msg-attachment">
      {isImage ? (
        <div className="msg-attachment-image-wrapper">
          <img
            src={attachment.thumbnailUrl || attachment.fileUrl}
            alt={attachment.fileName || 'Attachment'}
            className="msg-attachment-thumbnail"
            onError={() => setImgError(true)}
            loading="lazy"
          />
          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="msg-attachment-download-overlay"
              aria-label={`Download ${attachment.fileName}`}
              download
            >
              <FaDownload size={14} />
            </a>
          )}
        </div>
      ) : (
        <div className="msg-attachment-file-card">
          <FileIcon fileType={attachment.fileType} size={22} />
          <div className="msg-attachment-file-info">
            <span className="msg-attachment-file-name">
              {attachment.fileName || 'File'}
            </span>
            {attachment.fileSize && (
              <span className="msg-attachment-file-size">
                {formatFileSize(attachment.fileSize)}
              </span>
            )}
          </div>
          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="msg-attachment-download-btn"
              aria-label={`Download ${attachment.fileName}`}
              download
            >
              <FaDownload size={13} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MessageBubble
// ─────────────────────────────────────────────────────────────────────────────

/**
 * MessageBubble — renders a single chat message.
 *
 * Props:
 *   message      — message object from Redux store
 *   currentUser  — { _id, userType, name }
 */
const MessageBubble = ({ message, currentUser }) => {
  const dispatch = useDispatch();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!message) return null;

  const senderId = resolveSenderId(message.senderId);
  const currentUserId = currentUser?._id || '';
  const isOwn = senderId === currentUserId;

  // ── Deleted message placeholder (Req 15.4) ────────────────────────────────
  if (message.isDeleted) {
    return (
      <div
        className={`msg-row${isOwn ? ' msg-row-own' : ' msg-row-other'}`}
        data-message-id={message._id}
      >
        <div className="msg-bubble msg-bubble-deleted">
          <span className="msg-deleted-text">🚫 Message deleted</span>
          <span className="msg-time">{formatTime(message.createdAt)}</span>
        </div>
      </div>
    );
  }

  const hasAttachments = Array.isArray(message.attachments) && message.attachments.length > 0;

  // ── Delete handler (own messages only) ────────────────────────────────────
  const handleDelete = async () => {
    await dispatch(deleteMessage(message._id, message.conversationId));
    setShowDeleteConfirm(false);
  };

  const bubbleClasses = [
    'msg-bubble',
    isOwn ? 'msg-bubble-own' : 'msg-bubble-other',
    message.isEmergency ? 'msg-bubble-emergency' : '',
    message._pending ? 'msg-bubble-pending' : '',
    message._failed ? 'msg-bubble-failed' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={`msg-row${isOwn ? ' msg-row-own' : ' msg-row-other'}`}
      data-message-id={message._id}
    >
      {/* Avatar for received messages */}
      {!isOwn && (
        <div className="msg-avatar" aria-hidden="true">
          {message.senderName?.charAt(0).toUpperCase() || '?'}
        </div>
      )}

      <div className="msg-content-wrapper">
        {/* Sender name for received messages */}
        {!isOwn && message.senderName && (
          <span className="msg-sender-name">{message.senderName}</span>
        )}

        <div className={bubbleClasses}>
          {/* Emergency flag (Req 10.5) */}
          {message.isEmergency && (
            <div className="msg-emergency-flag" role="img" aria-label="Emergency message">
              <MdEmergency size={13} />
              <span>Emergency</span>
            </div>
          )}

          {/* Attachments (Req 4.9) */}
          {hasAttachments && (
            <div className="msg-attachments">
              {message.attachments.map((att, idx) => (
                <AttachmentItem key={att.fileId || att._id || idx} attachment={att} />
              ))}
            </div>
          )}

          {/* Text content */}
          {message.content && (
            <p className="msg-text">{message.content}</p>
          )}

          {/* Footer: time + status */}
          <div className="msg-footer">
            <span className="msg-time">{formatTime(message.createdAt)}</span>
            {isOwn && (
              <MessageStatus
                status={message.status}
                isPending={message._pending}
                isFailed={message._failed}
              />
            )}
          </div>
        </div>

        {/* Delete button for own messages */}
        {isOwn && !message._pending && !message._failed && (
          <div className="msg-actions">
            {showDeleteConfirm ? (
              <div className="msg-delete-confirm">
                <span>Delete?</span>
                <button
                  className="msg-delete-confirm-yes"
                  onClick={handleDelete}
                  aria-label="Confirm delete"
                >
                  Yes
                </button>
                <button
                  className="msg-delete-confirm-no"
                  onClick={() => setShowDeleteConfirm(false)}
                  aria-label="Cancel delete"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                className="msg-delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete message"
                aria-label="Delete message"
              >
                <FaTrash size={11} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
