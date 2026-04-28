/**
 * Thumbnail Generation Service
 *
 * Generates 200×200 JPEG thumbnails for image attachments in the
 * Doctor-Patient Chat System using the `sharp` library.
 * Non-image files are handled gracefully (returns null without throwing).
 *
 * Requirements: 4.5
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
  deleteThumbnail,
  isImageFile,
  THUMBNAIL_WIDTH,
  THUMBNAIL_HEIGHT,
  THUMBNAIL_QUALITY,
};
