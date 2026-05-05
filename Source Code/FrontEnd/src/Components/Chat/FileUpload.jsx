import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  FaUpload,
  FaTimes,
  FaFilePdf,
  FaFileWord,
  FaFileAlt,
  FaImage,
  FaCheckCircle,
  FaExclamationCircle,
  FaRedo,
} from 'react-icons/fa';

// Requirements: 4.1, 4.2, 4.4, 4.8, 23.5

const API_URL = 'http://127.0.0.1:3001';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function authHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: token };
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function FileTypeIcon({ fileType, size = 20 }) {
  const type = (fileType || '').toLowerCase();
  if (type.startsWith('image/')) return <FaImage size={size} className="file-upload-icon-image" />;
  if (type.includes('pdf')) return <FaFilePdf size={size} className="file-upload-icon-pdf" />;
  if (type.includes('word') || type.includes('doc')) return <FaFileWord size={size} className="file-upload-icon-word" />;
  return <FaFileAlt size={size} className="file-upload-icon-generic" />;
}

/**
 * Translate an Axios upload error into a specific, user-friendly message.
 * Requirements: 4.2, 4.4, 23.5
 *
 * @param {any} err - Axios error
 * @param {string} fileName - Original file name for context
 * @returns {string}
 */
function getUploadErrorMessage(err, fileName) {
  if (!err.response && err.request) {
    // Network error — no response received
    return `Network error while uploading "${fileName}". Please check your connection and try again.`;
  }

  const status = err.response?.status;
  const serverMsg = err.response?.data?.message;

  switch (status) {
    case 400:
      // Server-side validation failure — use the server message if available
      return serverMsg || `"${fileName}" was rejected. Please check the file and try again.`;

    case 413:
      return `"${fileName}" is too large. Maximum allowed size is 10 MB.`;

    case 415:
      return `"${fileName}" has an unsupported file type. Allowed: JPEG, PNG, PDF, DOC, DOCX.`;

    case 422:
      // Malware detected or content validation failure
      if (serverMsg && /malware|virus|threat/i.test(serverMsg)) {
        return `"${fileName}" was rejected because it may contain malware.`;
      }
      return serverMsg || `"${fileName}" failed content validation.`;

    case 429:
      return 'File upload limit reached. You can upload up to 10 files per hour.';

    case 401:
      return 'Your session has expired. Please log in again to upload files.';

    case 403:
      return "You don't have permission to upload files to this conversation.";

    case 500:
    case 502:
    case 503:
      return `Server error while uploading "${fileName}". Please try again later.`;

    default:
      return serverMsg || `Failed to upload "${fileName}". Please try again.`;
  }
}

/**
 * Validate a file against allowed types and max size.
 * Returns an error string or null if valid.
 * Requirements: 4.1, 4.2
 */
function validateFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
    return `"${file.name}" is not an allowed file type. Allowed: JPEG, PNG, PDF, DOC, DOCX.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `"${file.name}" exceeds the 10 MB size limit (${formatFileSize(file.size)}).`;
  }
  return null;
}

/**
 * FileUpload — drag-and-drop file uploader widget with retry and cancellation.
 *
 * Props:
 *   conversationId   — string, required for the upload API
 *   onUploadComplete — (fileData) => void  called with { fileId, fileUrl, thumbnailUrl, fileName, fileType, fileSize }
 *   onUploadError    — (errorMsg) => void
 *   onRemove         — (fileId) => void  called when user removes an uploaded file
 *   maxFiles         — number (default 5)
 *
 * Requirements: 4.1, 4.2, 4.4, 4.8, 23.5
 */
const FileUpload = ({
  conversationId,
  onUploadComplete,
  onUploadError,
  onRemove,
  maxFiles = 5,
}) => {
  // Each entry: { id, file, previewUrl, status: 'pending'|'uploading'|'done'|'error'|'cancelled', progress, error, fileData, cancelToken }
  const [uploads, setUploads] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const fileInputRef = useRef(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const updateUpload = useCallback((id, patch) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...patch } : u))
    );
  }, []);

  const generateId = () =>
    `fu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // ── Upload a single file via axios with progress and cancellation ─────────

  const uploadFile = useCallback(
    async (entry) => {
      if (!conversationId) {
        updateUpload(entry.id, {
          status: 'error',
          error: 'No conversation selected.',
        });
        if (onUploadError) onUploadError('No conversation selected.');
        return;
      }

      // Create a cancellation token for this upload (Req 23.5)
      const cancelSource = axios.CancelToken.source();
      updateUpload(entry.id, { status: 'uploading', progress: 0, cancelToken: cancelSource });

      const formData = new FormData();
      formData.append('file', entry.file);
      formData.append('conversationId', conversationId);

      try {
        const res = await axios.post(`${API_URL}/api/chat/upload`, formData, {
          headers: {
            ...authHeader(),
            'Content-Type': 'multipart/form-data',
          },
          cancelToken: cancelSource.token,
          onUploadProgress: (evt) => {
            if (evt.total) {
              const pct = Math.round((evt.loaded / evt.total) * 100);
              updateUpload(entry.id, { progress: pct });
            }
          },
        });

        const fileData = res.data;
        updateUpload(entry.id, { status: 'done', progress: 100, fileData, cancelToken: null });
        if (onUploadComplete) onUploadComplete(fileData);
      } catch (err) {
        // Distinguish cancellation from real errors
        if (axios.isCancel(err)) {
          updateUpload(entry.id, { status: 'cancelled', progress: 0, cancelToken: null });
          return;
        }

        const msg = getUploadErrorMessage(err, entry.file.name);
        updateUpload(entry.id, { status: 'error', error: msg, cancelToken: null });
        if (onUploadError) onUploadError(msg);
      }
    },
    [conversationId, onUploadComplete, onUploadError, updateUpload]
  );

  // ── Retry a failed upload ─────────────────────────────────────────────────

  const handleRetry = useCallback(
    (entry) => {
      // Reset state and re-upload the same file
      updateUpload(entry.id, { status: 'pending', progress: 0, error: null, fileData: null });
      // Use a fresh entry object with the same file
      uploadFile({ ...entry, status: 'pending', progress: 0, error: null, fileData: null });
    },
    [uploadFile, updateUpload]
  );

  // ── Cancel an in-progress upload ──────────────────────────────────────────

  const handleCancel = useCallback((entry) => {
    if (entry.cancelToken) {
      entry.cancelToken.cancel('Upload cancelled by user.');
    }
  }, []);

  // ── Process selected / dropped files ─────────────────────────────────────

  const processFiles = useCallback(
    (files) => {
      setGlobalError('');
      const remaining = maxFiles - uploads.filter((u) => u.status !== 'cancelled').length;
      if (remaining <= 0) {
        setGlobalError(`Maximum ${maxFiles} files allowed.`);
        return;
      }

      const toProcess = Array.from(files).slice(0, remaining);
      const newEntries = [];

      for (const file of toProcess) {
        const validationError = validateFile(file);
        if (validationError) {
          setGlobalError(validationError);
          continue;
        }
        const previewUrl = file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : null;
        newEntries.push({
          id: generateId(),
          file,
          previewUrl,
          status: 'pending',
          progress: 0,
          error: null,
          fileData: null,
          cancelToken: null,
        });
      }

      if (newEntries.length === 0) return;

      setUploads((prev) => [...prev, ...newEntries]);
      newEntries.forEach((entry) => uploadFile(entry));
    },
    [uploads, maxFiles, uploadFile]
  );

  // ── Remove an entry ───────────────────────────────────────────────────────

  const handleRemove = (entry) => {
    // Cancel if still uploading
    if (entry.cancelToken) {
      entry.cancelToken.cancel('Upload cancelled by user.');
    }
    if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
    setUploads((prev) => prev.filter((u) => u.id !== entry.id));
    if (entry.fileData?.fileId && onRemove) {
      onRemove(entry.fileData.fileId);
    }
    setGlobalError('');
  };

  // ── Drag-and-drop handlers ────────────────────────────────────────────────

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) processFiles(files);
  };

  // ── File input change ─────────────────────────────────────────────────────

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openFilePicker = () => fileInputRef.current?.click();

  // ── Render ────────────────────────────────────────────────────────────────

  const activeUploads = uploads.filter((u) => u.status !== 'cancelled');
  const canAddMore = activeUploads.length < maxFiles;

  return (
    <div className="file-upload-container">
      {/* Drop zone */}
      {canAddMore && (
        <div
          className={`file-upload-dropzone${isDragOver ? ' file-upload-dropzone-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFilePicker}
          role="button"
          tabIndex={0}
          aria-label="Click or drag files to upload"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openFilePicker();
            }
          }}
        >
          <FaUpload size={20} className="file-upload-dropzone-icon" />
          <span className="file-upload-dropzone-text">
            {isDragOver ? 'Drop files here' : 'Click or drag files to upload'}
          </span>
          <span className="file-upload-dropzone-hint">
            JPEG, PNG, PDF, DOC, DOCX · max 10 MB
          </span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
        multiple
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      {/* Global validation error */}
      {globalError && (
        <div className="file-upload-global-error" role="alert">
          <FaExclamationCircle size={13} />
          <span>{globalError}</span>
        </div>
      )}

      {/* Upload list */}
      {uploads.length > 0 && (
        <div className="file-upload-list">
          {uploads.map((entry) => {
            if (entry.status === 'cancelled') return null;
            return (
              <div
                key={entry.id}
                className={`file-upload-item file-upload-item-${entry.status}`}
              >
                {/* Preview / icon */}
                <div className="file-upload-item-preview">
                  {entry.previewUrl ? (
                    <img
                      src={entry.previewUrl}
                      alt={entry.file.name}
                      className="file-upload-item-thumbnail"
                    />
                  ) : (
                    <FileTypeIcon fileType={entry.file.type} size={22} />
                  )}
                </div>

                {/* Info */}
                <div className="file-upload-item-info">
                  <span className="file-upload-item-name">{entry.file.name}</span>
                  <span className="file-upload-item-size">
                    {formatFileSize(entry.file.size)}
                  </span>

                  {/* Progress bar */}
                  {(entry.status === 'uploading' || entry.status === 'pending') && (
                    <div
                      className="file-upload-progress-bar-track"
                      role="progressbar"
                      aria-valuenow={entry.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Uploading ${entry.file.name}: ${entry.progress}%`}
                    >
                      <div
                        className="file-upload-progress-bar-fill"
                        style={{ width: `${entry.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Specific error message (Req 4.2, 4.4, 23.5) */}
                  {entry.status === 'error' && (
                    <span className="file-upload-item-error" role="alert">
                      {entry.error}
                    </span>
                  )}
                </div>

                {/* Status icon + action buttons */}
                <div className="file-upload-item-actions">
                  {entry.status === 'done' && (
                    <FaCheckCircle size={15} className="file-upload-status-done" aria-label="Upload complete" />
                  )}

                  {entry.status === 'uploading' && (
                    <>
                      <span className="file-upload-status-pct" aria-live="polite">{entry.progress}%</span>
                      {/* Cancel button (Req 23.5) */}
                      <button
                        className="file-upload-item-cancel"
                        onClick={() => handleCancel(entry)}
                        aria-label={`Cancel upload of ${entry.file.name}`}
                        type="button"
                        title="Cancel upload"
                      >
                        <FaTimes size={11} />
                      </button>
                    </>
                  )}

                  {entry.status === 'error' && (
                    <>
                      <FaExclamationCircle size={15} className="file-upload-status-error" aria-label="Upload failed" />
                      {/* Retry button (Req 23.5) */}
                      <button
                        className="file-upload-item-retry"
                        onClick={() => handleRetry(entry)}
                        aria-label={`Retry upload of ${entry.file.name}`}
                        type="button"
                        title="Retry upload"
                      >
                        <FaRedo size={11} />
                      </button>
                    </>
                  )}
                </div>

                {/* Remove button (always visible except during active upload) */}
                {entry.status !== 'uploading' && (
                  <button
                    className="file-upload-item-remove"
                    onClick={() => handleRemove(entry)}
                    aria-label={`Remove ${entry.file.name}`}
                    type="button"
                  >
                    <FaTimes size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
