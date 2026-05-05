/**
 * Thumbnail Generation Service
 *
 * Generates 200×200 JPEG thumbnails for image attachments in the
 * Doctor-Patient Chat System using the `sharp` library.
 * Non-image files are handled gracefully (returns null without throwing).
 *
 * Also provides image compression before storage to reduce file sizes.
 *
 * Requirements: 4.5, 20.4
 */

const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const THUMBNAIL_WIDTH = 200;
const THUMBNAIL_HEIGHT = 200;
const THUMBNAIL_QUALITY = 80; // JPEG quality (0-100)
const THUMBNAIL_SUFFIX = '_thumb';
const THUMBNAIL_EXT = '.jpg';

/** MIME types that support thumbnail generation */
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png']);

/**
 * Compression settings for images stored as chat attachments.
 * Applied before storage to reduce bandwidth and disk usage (Req 20.4).
 */
const COMPRESSION_SETTINGS = {
  'image/jpeg': { quality: 85, progressive: true },
  'image/png':  { compressionLevel: 8, adaptiveFiltering: true },
};

/** Maximum dimension (width or height) for stored images. Larger images are resized. */
const MAX_IMAGE_DIMENSION = 2048;

// ---------------------------------------------------------------------------
// generateThumbnail
// ---------------------------------------------------------------------------

/**
 * Generate a 200×200 JPEG thumbnail for an image file.
 *
 * The thumbnail is written to the same directory as the source file with
 * `_thumb` appended before the extension (e.g. `photo-123_thumb.jpg`).
 *
 * For non-image files (PDF, DOC, DOCX) the function returns `null` without
 * throwing, allowing callers to treat thumbnail generation as optional.
 *
 * @param {object} file
 * @param {string} file.path     - Absolute path to the source file on disk.
 * @param {string} file.mimetype - MIME type of the source file.
 * @param {string} file.filename - Stored file name (used to derive thumbnail name).
 * @returns {Promise<{ thumbnailPath: string, thumbnailUrl: string } | null>}
 *   Resolves with thumbnail metadata, or `null` for non-image files.
 *
 * @example
 * const result = await generateThumbnail({
 *   path: '/uploads/chat-files/photo-abc123.jpg',
 *   mimetype: 'image/jpeg',
 *   filename: 'photo-abc123.jpg',
 * });
 * // result => { thumbnailPath: '/uploads/chat-files/photo-abc123_thumb.jpg',
 * //             thumbnailUrl: 'http://localhost:3001/uploads/chat-files/photo-abc123_thumb.jpg' }
 */
async function generateThumbnail(file) {
  if (!file || !file.path || !file.mimetype || !file.filename) {
    throw new Error('generateThumbnail: file object must have path, mimetype, and filename');
  }

  // Non-image files – return null gracefully (Requirement 4.5)
  if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
    return null;
  }

  // Derive thumbnail file name and path
  const dir = path.dirname(file.path);
  const ext = path.extname(file.filename);
  const nameWithoutExt = path.basename(file.filename, ext);
  const thumbnailFilename = `${nameWithoutExt}${THUMBNAIL_SUFFIX}${THUMBNAIL_EXT}`;
  const thumbnailPath = path.join(dir, thumbnailFilename);

  // Lazy-load sharp so the module can be imported even if sharp is not yet
  // installed (e.g. during unit tests that mock this function).
  let sharp;
  try {
    sharp = require('sharp'); // eslint-disable-line global-require
  } catch (err) {
    throw new Error(
      `sharp is not installed. Run "npm install sharp" in the Backend directory. Original error: ${err.message}`
    );
  }

  try {
    await sharp(file.path)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
        fit: 'cover',       // crop to fill the square (no distortion)
        position: 'centre', // centre the crop
      })
      .jpeg({ quality: THUMBNAIL_QUALITY })
      .toFile(thumbnailPath);
  } catch (err) {
    throw new Error(`Thumbnail generation failed for "${file.filename}": ${err.message}`);
  }

  // Build the public URL using the same base URL convention as fileStorageService
  const baseUrl = `http://localhost:${process.env.port || 3001}`;
  const thumbnailUrl = `${baseUrl}/uploads/chat-files/${thumbnailFilename}`;

  return { thumbnailPath, thumbnailUrl, thumbnailFilename };
}

// ---------------------------------------------------------------------------
// generateThumbnailAsync
// ---------------------------------------------------------------------------

/**
 * Generate a thumbnail asynchronously without blocking the upload response.
 *
 * Fires off thumbnail generation in the background and calls the optional
 * `onComplete` callback when done. Errors are logged but not propagated.
 *
 * This allows the file upload API to respond immediately while the thumbnail
 * is generated in the background (Req 20.4).
 *
 * @param {object}   file
 * @param {Function} [onComplete]  - Called with (error, result) when done
 * @returns {void}  Returns immediately; thumbnail is generated in background
 */
function generateThumbnailAsync(file, onComplete) {
  // Use setImmediate to defer to the next event loop iteration
  setImmediate(async () => {
    try {
      const result = await generateThumbnail(file);
      if (onComplete) onComplete(null, result);
    } catch (err) {
      console.error('[thumbnailService] Async thumbnail generation failed:', err.message);
      if (onComplete) onComplete(err, null);
    }
  });
}

// ---------------------------------------------------------------------------
// compressImage
// ---------------------------------------------------------------------------

/**
 * Compress an image file in-place before storage.
 *
 * Applies lossy/lossless compression and resizes images larger than
 * MAX_IMAGE_DIMENSION to reduce storage and bandwidth costs (Req 20.4).
 *
 * @param {object} file
 * @param {string} file.path     - Absolute path to the file on disk.
 * @param {string} file.mimetype - MIME type of the file.
 * @param {string} file.filename - Stored file name.
 * @returns {Promise<{ compressed: boolean, originalSize: number, compressedSize: number }>}
 */
async function compressImage(file) {
  if (!file || !file.path || !file.mimetype) {
    return { compressed: false, originalSize: 0, compressedSize: 0 };
  }

  if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
    return { compressed: false, originalSize: file.size || 0, compressedSize: file.size || 0 };
  }

  let sharp;
  try {
    sharp = require('sharp'); // eslint-disable-line global-require
  } catch (err) {
    console.warn('[thumbnailService] sharp not available, skipping compression:', err.message);
    return { compressed: false, originalSize: file.size || 0, compressedSize: file.size || 0 };
  }

  const originalSize = fs.statSync(file.path).size;
  const tempPath = `${file.path}.tmp`;

  try {
    const settings = COMPRESSION_SETTINGS[file.mimetype];
    let pipeline = sharp(file.path).rotate(); // auto-rotate based on EXIF

    // Resize if larger than max dimension (preserving aspect ratio)
    pipeline = pipeline.resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true, // never upscale
    });

    // Apply format-specific compression
    if (file.mimetype === 'image/jpeg') {
      pipeline = pipeline.jpeg(settings);
    } else if (file.mimetype === 'image/png') {
      pipeline = pipeline.png(settings);
    }

    await pipeline.toFile(tempPath);

    const compressedSize = fs.statSync(tempPath).size;

    // Only replace the original if compression actually reduced the size
    if (compressedSize < originalSize) {
      fs.renameSync(tempPath, file.path);
      return { compressed: true, originalSize, compressedSize };
    } else {
      // Compression made it larger — keep the original
      fs.unlinkSync(tempPath);
      return { compressed: false, originalSize, compressedSize: originalSize };
    }
  } catch (err) {
    // Clean up temp file on error
    try { fs.unlinkSync(tempPath); } catch (_) { /* ignore */ }
    console.error('[thumbnailService] Image compression failed:', err.message);
    return { compressed: false, originalSize, compressedSize: originalSize };
  }
}

// ---------------------------------------------------------------------------
// deleteThumbnail
// ---------------------------------------------------------------------------

/**
 * Delete a thumbnail file from disk.
 *
 * Silently succeeds if the file does not exist (idempotent).
 *
 * @param {string} thumbnailPath - Absolute path to the thumbnail file.
 * @returns {Promise<void>}
 */
async function deleteThumbnail(thumbnailPath) {
  if (!thumbnailPath) return;

  return new Promise((resolve, reject) => {
    fs.unlink(thumbnailPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        return reject(new Error(`Failed to delete thumbnail: ${err.message}`));
      }
      resolve();
    });
  });
}

// ---------------------------------------------------------------------------
// isImageFile
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the given MIME type supports thumbnail generation.
 *
 * @param {string} mimetype
 * @returns {boolean}
 */
function isImageFile(mimetype) {
  return IMAGE_MIME_TYPES.has(mimetype);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  generateThumbnail,
  generateThumbnailAsync,
  compressImage,
  deleteThumbnail,
  isImageFile,
  THUMBNAIL_WIDTH,
  THUMBNAIL_HEIGHT,
  THUMBNAIL_QUALITY,
  MAX_IMAGE_DIMENSION,
};


