/**
 * Redis Helper Functions
 *
 * Provides focused, domain-specific helper functions for the chat system's
 * three primary Redis use-cases:
 *
 *   1. Presence management  – track who is online/offline (Req 7.1, 7.2, 2.7)
 *   2. Typing indicators    – ephemeral per-conversation typing state (Req 5.5)
 *   3. Rate limiting        – per-user message throttling (Req 12.1, 12.6)
 *
 * All functions accept the redis client as their first argument so they remain
 * testable without module-level side-effects.  The convenience wrappers at the
 * bottom of this file bind the shared client from configs/redis.js and are the
 * recommended import for application code.
 *
 * Key namespaces
 * ──────────────
 *   presence:<userId>                  → JSON UserPresence object
 *   typing:<conversationId>:<userId>   → JSON TypingIndicator object
 *   ratelimit:msg:<userId>             → integer counter (hourly window)
 *   ratelimit:msg_min:<userId>         → integer counter (per-minute window)
 *   ratelimit:file:<userId>            → integer counter (hourly window)
 *
 * Requirements: 2.7, 5.5, 7.1, 7.2, 12.1, 12.6
 */

'use strict';

// ─── Constants ───────────────────────────────────────────────────────────────

/** TTL for online presence records (30 minutes, per Req 7.5) */
const PRESENCE_ONLINE_TTL = 30 * 60; // 1800 s

/** TTL for offline presence records – kept longer so "last seen" is readable */
const PRESENCE_OFFLINE_TTL = 24 * 60 * 60; // 86400 s

/** TTL for typing indicator (5 seconds, per Req 5.5) */
const TYPING_TTL = 5; // s

/** Rate-limit window for messages per hour (Req 12.1) */
const RATE_LIMIT_MSG_HOURLY_TTL = 60 * 60; // 3600 s
const RATE_LIMIT_MSG_HOURLY_MAX = 100;

/** Rate-limit window for messages per minute (Req 12.2) */
const RATE_LIMIT_MSG_MINUTE_TTL = 60; // s
const RATE_LIMIT_MSG_MINUTE_MAX = 10;

/** Rate-limit window for file uploads per hour (Req 12.7) */
const RATE_LIMIT_FILE_HOURLY_TTL = 60 * 60; // 3600 s
const RATE_LIMIT_FILE_HOURLY_MAX = 10;

// ─── Key builders ────────────────────────────────────────────────────────────

const keys = {
  presence: (userId) => `presence:${userId}`,
  typing: (conversationId, userId) => `typing:${conversationId}:${userId}`,
  typingPattern: (conversationId) => `typing:${conversationId}:*`,
  rateMsgHourly: (userId) => `ratelimit:msg:${userId}`,
  rateMsgMinute: (userId) => `ratelimit:msg_min:${userId}`,
  rateFileHourly: (userId) => `ratelimit:file:${userId}`,
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 – PRESENCE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Mark a user as online and store their presence metadata.
 *
 * Stores a UserPresence object under `presence:<userId>` with a 30-minute TTL.
 * Any subsequent activity should call refreshPresenceTTL() to extend the TTL.
 *
 * @param {import('ioredis').Redis} redisClient
 * @param {string} userId          - MongoDB ObjectId string
 * @param {object} presenceData    - Additional fields to persist alongside status
 * @param {string} presenceData.userType      - 'doctor' | 'patient'
 * @param {string} presenceData.userName      - Display name
 * @param {string} presenceData.socketId      - Socket.io socket ID
 * @param {string[]} [presenceData.activeConversations] - Conversation IDs
 * @returns {Promise<void>}
 *
 * Requirements: 7.1, 2.7
 */
async function setUserOnline(redisClient, userId, presenceData = {}) {
  if (!userId) throw new Error('setUserOnline: userId is required');

  const payload = {
    userId,
    status: 'online',
    lastSeen: Date.now(),
    ...presenceData,
  };

  await redisClient.setex(
    keys.presence(userId),
    PRESENCE_ONLINE_TTL,
    JSON.stringify(payload)
  );
}

/**
 * Mark a user as offline.
 *
 * Keeps the presence record alive for 24 hours so "last seen" timestamps
 * remain readable by other participants.
 *
 * @param {import('ioredis').Redis} redisClient
 * @param {string} userId
 * @param {object} [meta]          - Optional extra fields (e.g. userName, userType)
 * @returns {Promise<void>}
 *
 * Requirements: 7.2, 2.4
 */
async function setUserOffline(redisClient, userId, meta = {}) {
  if (!userId) throw new Error('setUserOffline: userId is required');

  // Merge with any existing presence data so we don't lose userName / userType
  let existing = {};
  try {
    const raw = await redisClient.get(keys.presence(userId));
    if (raw) existing = JSON.parse(raw);
  } catch (_) {
    // Non-fatal – proceed with what we have
  }

  const payload = {
    ...existing,
    ...meta,
    userId,
    status: 'offline',
    lastSeen: Date.now(),
  };

  await redisClient.setex(
    keys.presence(userId),
    PRESENCE_OFFLINE_TTL,
    JSON.stringify(payload)
  );
}

/**
 * Check whether a user is currently online.
 *
 * Returns true only when the presence record exists AND status === 'online'.
 * A missing key (expired TTL) is treated as offline.
 *
 * @param {import('ioredis').Redis} redisClient
 * @param {string} userId
 * @returns {Promise<boolean>}
 *
 * Requirements: 7.1, 7.7
 */
async function isUserOnline(redisClient, userId) {
  if (!userId) return false;

  try {
    const raw = await redisClient.get(keys.presence(userId));
    if (!raw) return false;
    const presence = JSON.parse(raw);
    return presence.status === 'online';
  } catch (err) {
    console.error('redisHelpers.isUserOnline error:', err.message);
    return false;
  }
}

/**
 * Retrieve the full presence object for a user.
 *
 * @param {import('ioredis').Redis} redisClient
 * @param {string} userId
 * @returns {Promise<object|null>} Presence object or null if not found
 *
 * Requirements: 7.7
 */
async function getUserPresence(redisClient, userId) {
  if (!userId) return null;

  try {
    const raw = await redisClient.get(keys.presence(userId));
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('redisHelpers.getUserPresence error:', err.message);
    return null;
  }
}

/**
 * Refresh the TTL on an existing online presence record.
 *
 * Should be called on every user action to prevent premature expiry (Req 7.6).
 *
 * @param {import('ioredis').Redis} redisClient
 * @param {string} userId
 * @returns {Promise<void>}
 *
 * Requirements: 7.6
 */
async function refreshPresenceTTL(redisClient, userId) {
  if (!userId) return;

  try {
    const raw = await redisClient.get(keys.presence(userId));
    if (!raw) return;

    const presence = JSON.parse(raw);
    if (presence.status === 'online') {
      presence.lastSeen = Date.now();
      await redisClient.setex(
        keys.presence(userId),
        PRESENCE_ONLINE_TTL,
        JSON.stringify(presence)
      );
    }
  } catch (err) {
    console.error('redisHelpers.refreshPresenceTTL error:', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 – TYPING INDICATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Record that a user has started typing in a conversation.
 *
 * Stores a TypingIndicator object under `typing:<conversationId>:<userId>`
 * with a 5-second TTL.  The key auto-expires if typing_stop is never received,
 * satisfying Req 5.6.
 *
 * @param {import('ioredis').Redis} redisClient
 * @param {string} conversationId
 * @param {string} userId
 * @param {object} typingMeta
 * @param {string} typingMeta.userName   - Display name of the typing user
 * @param {string} typingMeta.userType   - 'doctor' | 'patient'
 * @param {number} [ttl=5]               - Override TTL in seconds
 * @returns {Promise<void>}
 *
 * Requirements: 5.5, 5.1
 */
async function setTyping(redisClient, conversationId, userId, typingMeta = {}, ttl = TYPING_TTL) {
  if (!conversationId || !userId) {
    throw new Error('setTyping: conversationId and userId are required');
  }

  const payload = {
    conversationId,
    userId,
    userName: typingMeta.userName || '',
    userType: typingMeta.userType || '',
    timestamp: Date.now(),
    ttl,
  };

  await redisClient.setex(
    keys.typing(conversationId, userId),
    ttl,
    JSON.stringify(payload)
  );
}

/**
 * Remove the typing indicator for a user in a conversation.
 *
 * Called when the user sends a message or explicitly stops typing (Req 5.3, 5.4).
 *
 * @param {import('ioredis').Redis} redisClient
 * @param {string} conversationId
 * @param {string} userId
 * @returns {Promise<void>}
 *
 * Requirements: 5.3, 5.4
 */
async function clearTyping(redisClient, conversationId, userId) {
  if (!conversationId || !userId) return;

  await redisClient.del(keys.typing(conversationId, userId));
}

/**
 * Get all users currently typing in a conversation.
 *
 * Uses SCAN to find all `typing:<conversationId>:*` keys without blocking
 * the Redis event loop.  Returns an empty array when no one is typing or
 * when Redis is unavailable.
 *
 * @param {import('ioredis').Redis} redisClient
 * @param {string} conversationId
 * @returns {Promise<Array<{userId: string, userName: string, userType: string, timestamp: number}>>}
 *
 * Requirements: 5.5, 5.8
 */
async function getTypingUsers(redisClient, conversationId) {
  if (!conversationId) return [];

  try {
    const pattern = keys.typingPattern(conversationId);
    const matchingKeys = [];

    // Use SCAN to avoid blocking with KEYS in production
    let cursor = '0';
    do {
      const [nextCursor, batch] = await redisClient.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      matchingKeys.push(...batch);
    } while (cursor !== '0');

    if (matchingKeys.length === 0) return [];

    // Fetch all values in a single pipeline
    const pipeline = redisClient.pipeline();
    for (const key of matchingKeys) {
      pipeline.get(key);
    }
    const results = await pipeline.exec();

    const typingUsers = [];
    for (const [err, raw] of results) {
      if (err || !raw) continue;
      try {
        const indicator = JSON.parse(raw);
        typingUsers.push({
          userId: indicator.userId,
          userName: indicator.userName,
          userType: indicator.userType,
          timestamp: indicator.timestamp,
        });
      } catch (_) {
        // Skip malformed entries
      }
    }

    return typingUsers;
  } catch (err) {
    console.error('redisHelpers.getTypingUsers error:', err.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 – RATE LIMITING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check whether a user is within their rate limit for a given action.
 *
 * Does NOT increment the counter – call incrementRateLimit() separately after
 * a successful check to keep the two concerns distinct.
 *
 * @param {import('ioredis').Redis} redisClient
 * @param {string} userId
 * @param {'message_hourly'|'message_minute'|'file_hourly'} [limitType='message_hourly']
 * @returns {Promise<{allowed: boolean, current: number, limit: number, resetInSeconds: number}>}
 *
 * Requirements: 12.1, 12.6
 */
async function checkRateLimit(redisClient, userId, limitType = 'message_hourly') {
  if (!userId) {
    return { allowed: false, current: 0, limit: 0, resetInSeconds: 0 };
  }

  const { key, max } = _resolveLimitConfig(userId, limitType);

  try {
    const [rawCount, ttl] = await Promise.all([
      redisClient.get(key),
      redisClient.ttl(key),
    ]);

    const current = rawCount ? parseInt(rawCount, 10) : 0;
    const resetInSeconds = ttl > 0 ? ttl : 0;

    return {
      allowed: current < max,
      current,
      limit: max,
      resetInSeconds,
    };
  } catch (err) {
    console.error('redisHelpers.checkRateLimit error:', err.message);
    // Fail open – allow the request if Redis is unavailable (Req 23.4)
    return { allowed: true, current: 0, limit: max, resetInSeconds: 0 };
  }
}

/**
 * Increment the rate-limit counter for a user and return the updated state.
 *
 * On the first increment within a window the TTL is set automatically.
 * Subsequent increments within the same window do not reset the TTL.
 *
 * @param {import('ioredis').Redis} redisClient
 * @param {string} userId
 * @param {'message_hourly'|'message_minute'|'file_hourly'} [limitType='message_hourly']
 * @returns {Promise<{current: number, limit: number, exceeded: boolean, resetInSeconds: number}>}
 *
 * Requirements: 12.1, 12.2, 12.6, 12.7
 */
async function incrementRateLimit(redisClient, userId, limitType = 'message_hourly') {
  if (!userId) throw new Error('incrementRateLimit: userId is required');

  const { key, max, ttl } = _resolveLimitConfig(userId, limitType);

  try {
    // Atomic increment
    const current = await redisClient.incr(key);

    // Set TTL only on the first increment so the window is fixed
    if (current === 1) {
      await redisClient.expire(key, ttl);
    }

    const remainingTTL = await redisClient.ttl(key);

    return {
      current,
      limit: max,
      exceeded: current > max,
      resetInSeconds: remainingTTL > 0 ? remainingTTL : 0,
    };
  } catch (err) {
    console.error('redisHelpers.incrementRateLimit error:', err.message);
    // Fail open on Redis errors
    return { current: 0, limit: max, exceeded: false, resetInSeconds: 0 };
  }
}

/**
 * Reset the rate-limit counter for a user (e.g. for testing or admin override).
 *
 * @param {import('ioredis').Redis} redisClient
 * @param {string} userId
 * @param {'message_hourly'|'message_minute'|'file_hourly'} [limitType='message_hourly']
 * @returns {Promise<void>}
 */
async function resetRateLimit(redisClient, userId, limitType = 'message_hourly') {
  if (!userId) return;
  const { key } = _resolveLimitConfig(userId, limitType);
  await redisClient.del(key);
}

// ─── Private helpers ─────────────────────────────────────────────────────────

/**
 * Resolve the Redis key, max count, and TTL for a given limit type.
 * @private
 */
function _resolveLimitConfig(userId, limitType) {
  switch (limitType) {
    case 'message_minute':
      return {
        key: keys.rateMsgMinute(userId),
        max: RATE_LIMIT_MSG_MINUTE_MAX,
        ttl: RATE_LIMIT_MSG_MINUTE_TTL,
      };
    case 'file_hourly':
      return {
        key: keys.rateFileHourly(userId),
        max: RATE_LIMIT_FILE_HOURLY_MAX,
        ttl: RATE_LIMIT_FILE_HOURLY_TTL,
      };
    case 'message_hourly':
    default:
      return {
        key: keys.rateMsgHourly(userId),
        max: RATE_LIMIT_MSG_HOURLY_MAX,
        ttl: RATE_LIMIT_MSG_HOURLY_TTL,
      };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS – raw functions (accept redisClient as first arg)
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  // Presence
  setUserOnline,
  setUserOffline,
  isUserOnline,
  getUserPresence,
  refreshPresenceTTL,

  // Typing
  setTyping,
  clearTyping,
  getTypingUsers,

  // Rate limiting
  checkRateLimit,
  incrementRateLimit,
  resetRateLimit,

  // Exposed constants for use in other modules / tests
  constants: {
    PRESENCE_ONLINE_TTL,
    PRESENCE_OFFLINE_TTL,
    TYPING_TTL,
    RATE_LIMIT_MSG_HOURLY_MAX,
    RATE_LIMIT_MSG_MINUTE_MAX,
    RATE_LIMIT_FILE_HOURLY_MAX,
    RATE_LIMIT_MSG_HOURLY_TTL,
    RATE_LIMIT_MSG_MINUTE_TTL,
    RATE_LIMIT_FILE_HOURLY_TTL,
  },

  // Key builders (useful for direct Redis operations in tests)
  keys,
};
