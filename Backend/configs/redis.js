const Redis = require('ioredis');
require('dotenv').config();

/**
 * Redis Client Configuration for Chat System
 * 
 * Purpose: Provides Redis connection for:
 * - User presence tracking (online/offline status)
 * - Typing indicators with TTL
 * - Rate limiting for message sending
 * - Caching conversation metadata
 * - Session management
 * 
 * Requirements: 2.1, 2.2, 20.1
 */

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
};

// Create Redis client instance
const redis = new Redis(redisConfig);

// Connection event handlers
redis.on('connect', () => {
  console.log('✓ Redis client connected successfully');
});

redis.on('ready', () => {
  console.log('✓ Redis client ready to accept commands');
});

redis.on('error', (err) => {
  console.error('✗ Redis client error:', err.message);
});

redis.on('close', () => {
  console.log('⚠ Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('⟳ Redis client reconnecting...');
});

/**
 * Helper function to check Redis connection status
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
async function isRedisConnected() {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis ping failed:', error.message);
    return false;
  }
}

/**
 * Helper function to gracefully close Redis connection
 * @returns {Promise<void>}
 */
async function closeRedisConnection() {
  try {
    await redis.quit();
    console.log('✓ Redis connection closed gracefully');
  } catch (error) {
    console.error('Error closing Redis connection:', error.message);
    redis.disconnect();
  }
}

/**
 * Helper functions for common Redis operations in chat system
 */
const redisHelpers = {
  /**
   * Set user presence with TTL
   * @param {string} userId - User ID
   * @param {object} presenceData - Presence data object
   * @param {number} ttl - Time to live in seconds (default: 1800 = 30 minutes)
   */
  async setUserPresence(userId, presenceData, ttl = 1800) {
    const key = `presence:${userId}`;
    await redis.setex(key, ttl, JSON.stringify(presenceData));
  },

  /**
   * Get user presence
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} Presence data or null
   */
  async getUserPresence(userId) {
    const key = `presence:${userId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Delete user presence
   * @param {string} userId - User ID
   */
  async deleteUserPresence(userId) {
    const key = `presence:${userId}`;
    await redis.del(key);
  },

  /**
   * Set typing indicator with TTL
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @param {object} typingData - Typing indicator data
   * @param {number} ttl - Time to live in seconds (default: 5)
   */
  async setTypingIndicator(conversationId, userId, typingData, ttl = 5) {
    const key = `typing:${conversationId}:${userId}`;
    await redis.setex(key, ttl, JSON.stringify(typingData));
  },

  /**
   * Get typing indicator
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} Typing data or null
   */
  async getTypingIndicator(conversationId, userId) {
    const key = `typing:${conversationId}:${userId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Delete typing indicator
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   */
  async deleteTypingIndicator(conversationId, userId) {
    const key = `typing:${conversationId}:${userId}`;
    await redis.del(key);
  },

  /**
   * Increment rate limit counter
   * @param {string} userId - User ID
   * @param {number} ttl - Time to live in seconds (default: 3600 = 1 hour)
   * @returns {Promise<number>} Current count
   */
  async incrementRateLimit(userId, ttl = 3600) {
    const key = `ratelimit:${userId}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, ttl);
    }
    return count;
  },

  /**
   * Get rate limit count
   * @param {string} userId - User ID
   * @returns {Promise<number>} Current count
   */
  async getRateLimitCount(userId) {
    const key = `ratelimit:${userId}`;
    const count = await redis.get(key);
    return count ? parseInt(count) : 0;
  },

  /**
   * Cache conversation data
   * @param {string} conversationId - Conversation ID
   * @param {object} data - Conversation data
   * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
   */
  async cacheConversation(conversationId, data, ttl = 300) {
    const key = `conversation:${conversationId}`;
    await redis.setex(key, ttl, JSON.stringify(data));
  },

  /**
   * Get cached conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<object|null>} Conversation data or null
   */
  async getCachedConversation(conversationId) {
    const key = `conversation:${conversationId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Invalidate conversation cache
   * @param {string} conversationId - Conversation ID
   */
  async invalidateConversationCache(conversationId) {
    const key = `conversation:${conversationId}`;
    await redis.del(key);
  },
};

module.exports = {
  redis,
  redisHelpers,
  isRedisConnected,
  closeRedisConnection,
};
