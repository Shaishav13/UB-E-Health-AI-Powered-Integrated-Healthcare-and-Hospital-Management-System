
const path = require('path');
const fs = require('fs');

const THUMBNAIL_WIDTH = 200;
const THUMBNAIL_HEIGHT = 200;
const THUMBNAIL_QUALITY = 80; // JPEG quality (0-100)
const THUMBNAIL_SUFFIX = '_thumb';
const THUMBNAIL_EXT = '.jpg';

// MIME types that support thumbnail generation
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png']);

// Compression settings for images stored as chat attachments.
const COMPRESSION_SETTINGS = {
  'image/jpeg': { quality: 85, progressive: true },
  'image/png':  { compressionLevel: 8, adaptiveFiltering: true },
};

// Maximum dimension (width or height) for stored images. Larger images are resized.
const MAX_IMAGE_DIMENSION = 2048;

// Generate a 200×200 JPEG thumbnail for an image file.
// For non-image files (PDF, DOC, DOCX) the function returns null without throwing.
async function generateThumbnail(file) {
  if (!file || !file.path || !file.mimetype || !file.filename) {
    throw new Error('generateThumbnail: file object must have path, mimetype, and filename');
  }

  // Non-image files – return null gracefully
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

// Generate a thumbnail asynchronously without blocking the upload response.
// Fires off thumbnail generation in the background and calls the optional
// onComplete callback when done. Errors are logged but not propagated.
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

// Compress an image file in-place before storage.
// Applies lossy/lossless compression and resizes images larger than
// MAX_IMAGE_DIMENSION to reduce storage and bandwidth costs.
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

// Delete a thumbnail file from disk.
// Silently succeeds if the file does not exist (idempotent).
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

// Returns true if the given MIME type supports thumbnail generation.
function isImageFile(mimetype) {
  return IMAGE_MIME_TYPES.has(mimetype);
}

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
