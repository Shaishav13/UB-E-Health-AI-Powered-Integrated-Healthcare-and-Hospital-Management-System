
const mongoose = require('mongoose');

// Validates if a string is a properly formatted MongoDB ObjectId
function validateObjectId(id) {
  if (!id || typeof id !== 'string') {
    return false;
  }

  // Check if it matches MongoDB ObjectId format (24 hex characters)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  
  if (!objectIdRegex.test(id.trim())) {
    return false;
  }

  // Additional validation using mongoose
  return mongoose.Types.ObjectId.isValid(id);
}

// Validates message content for length and emptiness
function validateMessageContent(content) {
  const MAX_LENGTH = 5000;

  // Check if content exists and is a string
  if (!content || typeof content !== 'string') {
    return {
      isValid: false,
      error: 'Message content must be a string'
    };
  }

  // Trim whitespace and check if empty
  const trimmedContent = content.trim();
  
  if (trimmedContent.length === 0) {
    return {
      isValid: false,
      error: 'Message content cannot be empty'
    };
  }

  // Check maximum length
  if (content.length > MAX_LENGTH) {
    return {
      isValid: false,
      error: `Message content exceeds maximum length of ${MAX_LENGTH} characters`
    };
  }

  return {
    isValid: true,
    error: null
  };
}

// Validates file type against allowed MIME types
function validateFileType(mimeType, fileExtension = '') {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const allowedExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.pdf',
    '.doc',
    '.docx'
  ];

  // Check if mimeType is provided and is a string
  if (!mimeType || typeof mimeType !== 'string') {
    return {
      isValid: false,
      error: 'File type must be specified'
    };
  }

  // Validate MIME type
  if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: JPEG, PNG, PDF, DOC, DOCX`
    };
  }

  // If file extension is provided, validate it matches the MIME type
  if (fileExtension) {
    const normalizedExtension = fileExtension.toLowerCase();
    
    if (!allowedExtensions.includes(normalizedExtension)) {
      return {
        isValid: false,
        error: `File extension not allowed: ${fileExtension}`
      };
    }

    // Cross-validate MIME type and extension
    const mimeExtensionMap = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    };

    const expectedExtensions = mimeExtensionMap[mimeType.toLowerCase()];
    
    if (expectedExtensions && !expectedExtensions.includes(normalizedExtension)) {
      return {
        isValid: false,
        error: `File extension ${fileExtension} does not match MIME type ${mimeType}`
      };
    }
  }

  return {
    isValid: true,
    error: null
  };
}

// Validates file size against maximum allowed size (10MB)
function validateFileSize(fileSize) {
  const MAX_FILE_SIZE = 10485760; // 10MB in bytes
  const MAX_FILE_SIZE_MB = 10;

  // Check if fileSize is provided and is a number
  if (fileSize === undefined || fileSize === null || typeof fileSize !== 'number') {
    return {
      isValid: false,
      error: 'File size must be specified'
    };
  }

  // Check if fileSize is negative
  if (fileSize < 0) {
    return {
      isValid: false,
      error: 'File size cannot be negative'
    };
  }

  // Check if fileSize is zero
  if (fileSize === 0) {
    return {
      isValid: false,
      error: 'File size cannot be zero'
    };
  }

  // Check maximum size
  if (fileSize > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE_MB}MB`
    };
  }

  return {
    isValid: true,
    error: null
  };
}

// Validates an array of attachment IDs
function validateAttachments(attachmentIds) {
  const MAX_ATTACHMENTS = 5;

  // Check if attachmentIds is an array
  if (!Array.isArray(attachmentIds)) {
    return {
      isValid: false,
      error: 'Attachments must be an array'
    };
  }

  // Check maximum number of attachments
  if (attachmentIds.length > MAX_ATTACHMENTS) {
    return {
      isValid: false,
      error: `Maximum ${MAX_ATTACHMENTS} attachments allowed per message`
    };
  }

  // Validate each attachment ID
  for (let i = 0; i < attachmentIds.length; i++) {
    if (!validateObjectId(attachmentIds[i])) {
      return {
        isValid: false,
        error: `Invalid attachment ID at index ${i}: ${attachmentIds[i]}`
      };
    }
  }

  return {
    isValid: true,
    error: null
  };
}

// Validates conversation ID format
function validateConversationId(conversationId) {
  if (!validateObjectId(conversationId)) {
    return {
      isValid: false,
      error: 'Invalid conversation ID format'
    };
  }

  return {
    isValid: true,
    error: null
  };
}

// Validates pagination parameters
function validatePagination(page, limit) {
  const MAX_LIMIT = 100;
  const MIN_LIMIT = 1;

  // Validate page
  if (page !== undefined && page !== null) {
    if (typeof page !== 'number' || !Number.isInteger(page) || page < 1) {
      return {
        isValid: false,
        error: 'Page must be a positive integer'
      };
    }
  }

  // Validate limit
  if (limit !== undefined && limit !== null) {
    if (typeof limit !== 'number' || !Number.isInteger(limit)) {
      return {
        isValid: false,
        error: 'Limit must be an integer'
      };
    }

    if (limit < MIN_LIMIT || limit > MAX_LIMIT) {
      return {
        isValid: false,
        error: `Limit must be between ${MIN_LIMIT} and ${MAX_LIMIT}`
      };
    }
  }

  return {
    isValid: true,
    error: null
  };
}

// Validates search query
function validateSearchQuery(query) {
  const MIN_LENGTH = 2;
  const MAX_LENGTH = 100;

  if (!query || typeof query !== 'string') {
    return {
      isValid: false,
      error: 'Search query must be a string'
    };
  }

  const trimmedQuery = query.trim();

  if (trimmedQuery.length < MIN_LENGTH) {
    return {
      isValid: false,
      error: `Search query must be at least ${MIN_LENGTH} characters`
    };
  }

  if (trimmedQuery.length > MAX_LENGTH) {
    return {
      isValid: false,
      error: `Search query must not exceed ${MAX_LENGTH} characters`
    };
  }

  return {
    isValid: true,
    error: null
  };
}

module.exports = {
  validateObjectId,
  validateMessageContent,
  validateFileType,
  validateFileSize,
  validateAttachments,
  validateConversationId,
  validatePagination,
  validateSearchQuery
};
