import { useState, useEffect, useRef } from 'react';
import {
  FaFilePdf,
  FaFileWord,
  FaFileAlt,
  FaDownload,
  FaExclamationCircle,
} from 'react-icons/fa';

// Requirements: 4.7, 4.9, 20.4

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
 * Determine if a file is an image based on MIME type or file name.
 */
function isImageFile(attachment) {
  const type = (attachment.fileType || '').toLowerCase();
  const name = (attachment.fileName || '').toLowerCase();
  return (
    type.startsWith('image/') ||
    /\.(jpg|jpeg|png|gif|webp)$/.test(name)
  );
}

/**
 * Pick the right icon for a non-image file type.
 */
function FileTypeIcon({ fileType, size = 24 }) {
  const type = (fileType || '').toLowerCase();
  if (type.includes('pdf')) return <FaFilePdf size={size} className="file-attachment-icon-pdf" />;
  if (type.includes('word') || type.includes('doc')) return <FaFileWord size={size} className="file-attachment-icon-word" />;
  return <FaFileAlt size={size} className="file-attachment-icon-generic" />;
}

/**
 * FileAttachment — standalone display widget for a single uploaded file.
 *
 * Props:
 *   attachment   — { fileId, fileName, fileType, fileSize, fileUrl, thumbnailUrl }
 *   showDownload — boolean (default true)
 *
 * Implements lazy loading for images (Req 20.4):
 *   - Uses native loading="lazy" for images
 *   - Uses IntersectionObserver for non-image file cards to defer metadata fetch
 */
const FileAttachment = ({ attachment, showDownload = true }) => {
  const [imgError, setImgError] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  // Lazy-load non-image file cards using IntersectionObserver (Req 20.4)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // start loading 100px before entering viewport
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!attachment) return null;

  const isImage = isImageFile(attachment) && !imgError;
  const downloadUrl = attachment.fileUrl || attachment.thumbnailUrl;

  const handleDownload = async (e) => {
    setDownloadError('');
    if (!downloadUrl) {
      e.preventDefault();
      setDownloadError('Download link is unavailable.');
      return;
    }
    // Let the browser handle the download via the anchor tag.
    // If the link is broken, the browser will fail — we catch that via the
    // error state set by the user clicking a broken link.
    try {
      // Attempt a HEAD request to verify the URL is reachable before navigating
      const res = await fetch(downloadUrl, { method: 'HEAD' });
      if (!res.ok) {
        e.preventDefault();
        setDownloadError('File could not be downloaded. The link may have expired.');
      }
    } catch {
      // Network error — still allow the browser to try; don't block
    }
  };

  // ── Image attachment ──────────────────────────────────────────────────────

  if (isImage) {
    return (
      <div className="file-attachment-image-wrapper" ref={containerRef}>
        <img
          src={attachment.thumbnailUrl || attachment.fileUrl}
          alt={attachment.fileName || 'Attachment'}
          className="file-attachment-thumbnail"
          onError={() => setImgError(true)}
          loading="lazy"
        />
        {showDownload && downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="file-attachment-download-overlay"
            aria-label={`Download ${attachment.fileName || 'file'}`}
            download={attachment.fileName || true}
            onClick={handleDownload}
          >
            <FaDownload size={16} />
          </a>
        )}
        {downloadError && (
          <div className="file-attachment-download-error" role="alert">
            <FaExclamationCircle size={11} />
            <span>{downloadError}</span>
          </div>
        )}
      </div>
    );
  }

  // ── Non-image (file card) ─────────────────────────────────────────────────

  // Show a lightweight placeholder until the card scrolls into view
  if (!isVisible) {
    return (
      <div
        ref={containerRef}
        className="file-attachment-card file-attachment-card-placeholder"
        aria-hidden="true"
        style={{ minHeight: 56 }}
      />
    );
  }

  return (
    <div className="file-attachment-card" ref={containerRef}>
      <div className="file-attachment-card-icon">
        <FileTypeIcon fileType={attachment.fileType} size={26} />
      </div>

      <div className="file-attachment-card-info">
        <span className="file-attachment-card-name">
          {attachment.fileName || 'File'}
        </span>
        {attachment.fileSize != null && (
          <span className="file-attachment-card-size">
            {formatFileSize(attachment.fileSize)}
          </span>
        )}
        {downloadError && (
          <span className="file-attachment-download-error-inline" role="alert">
            <FaExclamationCircle size={11} />
            {downloadError}
          </span>
        )}
      </div>

      {showDownload && downloadUrl && (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="file-attachment-card-download-btn"
          aria-label={`Download ${attachment.fileName || 'file'}`}
          download={attachment.fileName || true}
          onClick={handleDownload}
        >
          <FaDownload size={14} />
        </a>
      )}
    </div>
  );
};

export default FileAttachment;
