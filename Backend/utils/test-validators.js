/**
 * Manual Test Runner for Validators
 * 
 * Run with: node Backend/utils/test-validators.js
 */

const {
  validateObjectId,
  validateMessageContent,
  validateFileType,
  validateFileSize,
  validateAttachments,
  validateConversationId,
  validatePagination,
  validateSearchQuery
} = require('./validators');

console.log('=== Testing Validators ===\n');

// Test validateObjectId
console.log('1. Testing validateObjectId:');
console.log('  Valid ObjectId:', validateObjectId('507f1f77bcf86cd799439011')); // Should be true
console.log('  Invalid ObjectId:', validateObjectId('invalid-id')); // Should be false
console.log('  Empty string:', validateObjectId('')); // Should be false
console.log('  Null:', validateObjectId(null)); // Should be false
console.log('');

// Test validateMessageContent
console.log('2. Testing validateMessageContent:');
console.log('  Valid message:', validateMessageContent('Hello World'));
console.log('  Empty message:', validateMessageContent('   '));
console.log('  Too long message:', validateMessageContent('a'.repeat(5001)));
console.log('  Max length message:', validateMessageContent('a'.repeat(5000)));
console.log('');

// Test validateFileType
console.log('3. Testing validateFileType:');
console.log('  Valid JPEG:', validateFileType('image/jpeg', '.jpg'));
console.log('  Valid PNG:', validateFileType('image/png', '.png'));
console.log('  Valid PDF:', validateFileType('application/pdf', '.pdf'));
console.log('  Invalid type:', validateFileType('application/exe'));
console.log('  Mismatched type:', validateFileType('image/jpeg', '.pdf'));
console.log('');

// Test validateFileSize
console.log('4. Testing validateFileSize:');
console.log('  Valid size (1MB):', validateFileSize(1024 * 1024));
console.log('  Valid size (5MB):', validateFileSize(5 * 1024 * 1024));
console.log('  Too large (15MB):', validateFileSize(15 * 1024 * 1024));
console.log('  Exact limit (10MB):', validateFileSize(10485760));
console.log('  Negative size:', validateFileSize(-100));
console.log('  Zero size:', validateFileSize(0));
console.log('');

// Test validateAttachments
console.log('5. Testing validateAttachments:');
console.log('  Valid attachments:', validateAttachments(['507f1f77bcf86cd799439011', '5f8d0d55b54764421b7156c9']));
console.log('  Too many attachments:', validateAttachments(Array(6).fill('507f1f77bcf86cd799439011')));
console.log('  Invalid ID in array:', validateAttachments(['507f1f77bcf86cd799439011', 'invalid-id']));
console.log('  Empty array:', validateAttachments([]));
console.log('');

// Test validateConversationId
console.log('6. Testing validateConversationId:');
console.log('  Valid ID:', validateConversationId('507f1f77bcf86cd799439011'));
console.log('  Invalid ID:', validateConversationId('invalid-id'));
console.log('');

// Test validatePagination
console.log('7. Testing validatePagination:');
console.log('  Valid pagination:', validatePagination(1, 20));
console.log('  Invalid page (0):', validatePagination(0, 20));
console.log('  Invalid limit (150):', validatePagination(1, 150));
console.log('  Invalid limit (0):', validatePagination(1, 0));
console.log('  Undefined params:', validatePagination(undefined, undefined));
console.log('');

// Test validateSearchQuery
console.log('8. Testing validateSearchQuery:');
console.log('  Valid query:', validateSearchQuery('test search'));
console.log('  Too short:', validateSearchQuery('a'));
console.log('  Too long:', validateSearchQuery('a'.repeat(101)));
console.log('  Min length:', validateSearchQuery('ab'));
console.log('  Max length:', validateSearchQuery('a'.repeat(100)));
console.log('');

console.log('=== All Tests Complete ===');
