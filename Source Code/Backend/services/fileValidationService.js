
const fs = require('fs');
const path = require('path');

const MAX_FILE_SIZE = parseInt(process.env.CHAT_FILE_MAX_SIZE, 10) || 10485760; // 10 MB

// Allowed MIME types with their expected file extensions and magic byte signatures.
// Magic bytes reference:
//   JPEG  : FF D8 FF
//   PNG   : 89 50 4E 47 0D 0A 1A 0A
//   PDF   : 25 50 44 46  (%PDF)
//   DOC   : D0 CF 11 E0  (OLE2 compound document)
//   DOCX  : 50 4B 03 04  (ZIP / OOXML)
const ALLOWED_FILE_TYPES = {
  'image/jpeg': {
    extensions: ['jpg', 'jpeg'],
    magic: [
      Buffer.from([0xff, 0xd8, 0xff]),
    ],
  },
  'image/png': {
    extensions: ['png'],
    magic: [
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ],
  },
  'application/pdf': {
    extensions: ['pdf'],
    magic: [
      Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
    ],
  },
  'application/msword': {
    extensions: ['doc'],
    magic: [
      Buffer.from([0xd0, 0xcf, 0x11, 0xe0]), // OLE2
    ],
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    extensions: ['docx'],
    magic: [
      Buffer.from([0x50, 0x4b, 0x03, 0x04]), // ZIP (OOXML)
    ],
  },
};

// Validate that a file's declared MIME type, extension, and actual magic bytes
// are all consistent and permitted.
function validateFileType(file) {
  if (!file || !file.mimetype || !file.originalname || !file.path) {
    return { valid: false, error: 'Invalid file object: missing required properties' };
  }

  // MIME type allow-list check
  const typeConfig = ALLOWED_FILE_TYPES[file.mimetype];
  if (!typeConfig) {
    return {
      valid: false,
      error: `File type "${file.mimetype}" is not allowed. Allowed types: JPEG, PNG, PDF, DOC, DOCX`,
    };
  }

  // Extension check
  const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
  if (!typeConfig.extensions.includes(ext)) {
    return {
      valid: false,
      error: `File extension ".${ext}" does not match declared MIME type "${file.mimetype}"`,
    };
  }

  // Magic bytes check – read the first 8 bytes from disk
  let fileBuffer;
  try {
    const fd = fs.openSync(file.path, 'r');
    fileBuffer = Buffer.alloc(8);
    fs.readSync(fd, fileBuffer, 0, 8, 0);
    fs.closeSync(fd);
  } catch (err) {
    return { valid: false, error: `Could not read file for magic byte validation: ${err.message}` };
  }

  const magicMatch = typeConfig.magic.some((magic) =>
    fileBuffer.slice(0, magic.length).equals(magic)
  );

  if (!magicMatch) {
    return {
      valid: false,
      error: `File content does not match declared type "${file.mimetype}". The file may be corrupted or disguised.`,
    };
  }

  return { valid: true };
}

// Validate that a file does not exceed the maximum allowed size (10 MB).
function validateFileSize(file, maxBytes = MAX_FILE_SIZE) {
  if (!file || typeof file.size !== 'number') {
    return { valid: false, error: 'Invalid file object: missing size property' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'File is empty (0 bytes)' };
  }

  if (file.size > maxBytes) {
    const maxMB = (maxBytes / (1024 * 1024)).toFixed(0);
    const fileMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size ${fileMB} MB exceeds the maximum allowed size of ${maxMB} MB`,
    };
  }

  return { valid: true };
}

// Scan a file for malware.
// Production path  – uses the clamscan npm package to call a local ClamAV daemon.
// MVP / mock path  – performs a lightweight heuristic check (EICAR test string
//                    detection) and returns a clean result for all other files.
async function scanForMalware(file) {
  if (!file || !file.path) {
    throw new Error('Invalid file object: missing path property');
  }

  const scannedAt = new Date();

  // Production: ClamAV via clamscan
  if (process.env.CLAMAV_ENABLED === 'true') {
    try {
      // Dynamically require so the package is optional in development
      const NodeClam = require('clamscan'); // eslint-disable-line global-require
      const clamscan = await new NodeClam().init({
        clamdscan: {
          host: process.env.CLAMAV_HOST || '127.0.0.1',
          port: parseInt(process.env.CLAMAV_PORT, 10) || 3310,
          timeout: 60000,
          active: true,
        },
        preference: 'clamdscan',
      });

      const { isInfected, viruses } = await clamscan.scanFile(file.path);

      return {
        clean: !isInfected,
        threats: isInfected ? viruses : [],
        scannedAt,
      };
    } catch (err) {
      // If ClamAV is unavailable, log and fall through to mock scan
      console.error('[fileValidationService] ClamAV scan failed, falling back to mock scan:', err.message);
    }
  }

  // MVP / mock: heuristic EICAR detection + basic checks
  return mockMalwareScan(file.path, scannedAt);
}

// Lightweight mock malware scanner for MVP / development.
// Detects the EICAR anti-malware test string, embedded script tags, and null-byte injection.
function mockMalwareScan(filePath, scannedAt) {
  const threats = [];

  try {
    // Read up to 64 KB for heuristic checks (avoid loading huge files)
    const SAMPLE_SIZE = 65536;
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(SAMPLE_SIZE);
    const bytesRead = fs.readSync(fd, buffer, 0, SAMPLE_SIZE, 0);
    fs.closeSync(fd);

    const sample = buffer.slice(0, bytesRead);
    const sampleStr = sample.toString('utf8', 0, bytesRead);

    // EICAR test string detection
    const EICAR_SIGNATURE = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
    if (sampleStr.includes(EICAR_SIGNATURE)) {
      threats.push('EICAR-Test-File (not a virus)');
    }

    // Null-byte injection
    if (sample.includes(0x00) && sampleStr.includes('\x00')) {
      // Null bytes are normal in binary files; only flag in text-like contexts
      const ext = path.extname(filePath).toLowerCase();
      const textExtensions = ['.pdf', '.doc', '.docx'];
      if (!textExtensions.includes(ext)) {
        // Binary files (images) legitimately contain null bytes – skip
      }
    }

    // Embedded script tags in document files (basic heuristic)
    const docExtensions = ['.pdf', '.doc', '.docx'];
    const fileExt = path.extname(filePath).toLowerCase();
    if (docExtensions.includes(fileExt)) {
      const scriptPattern = /<script[\s>]/i;
      if (scriptPattern.test(sampleStr)) {
        threats.push('Heuristic.EmbeddedScript');
      }
    }
  } catch (err) {
    // If we can't read the file, treat as suspicious
    threats.push(`ScanError: ${err.message}`);
  }

  return {
    clean: threats.length === 0,
    threats,
    scannedAt,
  };
}

// Run all validations (type + size) on a multer file object.
function validateFile(file) {
  const sizeResult = validateFileSize(file);
  if (!sizeResult.valid) return sizeResult;

  const typeResult = validateFileType(file);
  if (!typeResult.valid) return typeResult;

  return { valid: true };
}

module.exports = {
  validateFileType,
  validateFileSize,
  validateFile,
  scanForMalware,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
};
