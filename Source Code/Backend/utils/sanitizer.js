/**
 * Input Sanitization Utility
 * 
 * Provides functions to sanitize user input and prevent security vulnerabilities
 * including XSS attacks and path traversal exploits.
 * 
 * Requirements: 1.5, 17.1, 17.2, 17.5
 */

const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Create a DOMPurify instance with jsdom window
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Sanitizes HTML content to prevent XSS attacks
 * 
 * @param {string} content - The HTML content to sanitize
 * @returns {string} - Sanitized HTML content safe for display
 * 
 * @example
 * const userInput = '<script>alert("XSS")</script>Hello';
 * const safe = sanitizeHTML(userInput); // Returns: 'Hello'
 */
function sanitizeHTML(content) {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Configure DOMPurify to be strict
  const config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true
  };

  // Sanitize the content
  const sanitized = purify.sanitize(content, config);

  return sanitized;
}

/**
 * Sanitizes filename to prevent path traversal attacks
 * 
 * Removes or replaces dangerous characters that could be used to
 * navigate the file system or execute commands.
 * 
 * @param {string} filename - The filename to sanitize
 * @returns {string} - Sanitized filename safe for file system operations
 * 
 * @example
 * const malicious = '../../../etc/passwd';
 * const safe = sanitizeFilename(malicious); // Returns: 'etc_passwd'
 * 
 * const normal = 'my document.pdf';
 * const safe2 = sanitizeFilename(normal); // Returns: 'my_document.pdf'
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed_file';
  }

  // Remove path separators and dangerous characters
  let sanitized = filename
    // Remove path traversal attempts
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters
    .replace(/[\x00-\x1f\x80-\x9f]/g, '')
    // Remove special characters that could cause issues
    .replace(/[<>:"|?*]/g, '')
    // Replace spaces with underscores
    .replace(/\s+/g, '_')
    // Remove leading/trailing dots and spaces
    .replace(/^[.\s]+|[.\s]+$/g, '');

  // Ensure filename is not empty after sanitization
  if (sanitized.length === 0) {
    return 'unnamed_file';
  }

  // Limit filename length to 255 characters (common filesystem limit)
  if (sanitized.length > 255) {
    const extension = sanitized.substring(sanitized.lastIndexOf('.'));
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
    sanitized = nameWithoutExt.substring(0, 255 - extension.length) + extension;
  }

  return sanitized;
}

/**
 * Sanitizes message content for safe storage and display
 * 
 * Combines HTML sanitization with additional checks for message content.
 * Trims whitespace and ensures content is safe for database storage.
 * 
 * @param {string} content - The message content to sanitize
 * @returns {string} - Sanitized message content
 * 
 * @example
 * const message = '  <script>alert("XSS")</script>Hello World!  ';
 * const safe = sanitizeMessageContent(message); // Returns: 'Hello World!'
 */
function sanitizeMessageContent(content) {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = content.trim();

  // Sanitize HTML to prevent XSS
  sanitized = sanitizeHTML(sanitized);

  // Additional sanitization: normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized;
}

/**
 * Escapes special characters in a string for safe use in regular expressions
 * 
 * @param {string} string - The string to escape
 * @returns {string} - Escaped string safe for regex use
 */
function escapeRegex(string) {
  if (!string || typeof string !== 'string') {
    return '';
  }

  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validates and sanitizes ObjectId strings
 * 
 * @param {string} id - The ObjectId string to validate
 * @returns {string|null} - Sanitized ObjectId or null if invalid
 */
function sanitizeObjectId(id) {
  if (!id || typeof id !== 'string') {
    return null;
  }

  // Remove any whitespace
  const sanitized = id.trim();

  // Check if it matches MongoDB ObjectId format (24 hex characters)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  
  if (!objectIdRegex.test(sanitized)) {
    return null;
  }

  return sanitized;
}

module.exports = {
  sanitizeHTML,
  sanitizeFilename,
  sanitizeMessageContent,
  escapeRegex,
  sanitizeObjectId
};
