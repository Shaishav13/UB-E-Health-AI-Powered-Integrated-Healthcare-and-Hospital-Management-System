
// TTL for online presence records (30 minutes)
const PRESENCE_ONLINE_TTL = 30 * 60; // 1800 s

// TTL for offline presence records – kept longer so "last seen" is readable
const PRESENCE_OFFLINE_TTL = 24 * 60 * 60; // 86400 s

// TTL for typing indicator (5 seconds)
const TYPING_TTL = 5; // s

// Rate-limit window for messages per hour
const RATE_LIMIT_MSG_HOURLY_TTL = 60 * 60; // 3600 s
const RATE_LIMIT_MSG_HOURLY_MAX = 100;

// Rate-limit window for messages per minute
const RATE_LIMIT_MSG_MINUTE_TTL = 60; // s
const RATE_LIMIT_MSG_MINUTE_MAX = 10;

// Rate-limit window for file uploads per hour
const RATE_LIMIT_FILE_HOURLY_TTL = 60 * 60; // 3600 s
const RATE_LIMIT_FILE_HOURLY_MAX = 10;

const keys = {
  presence: (userId) => `presence:${userId}`,
  typing: (conversationId, userId) => `typing:${conversationId}:${userId}`,
  typingPattern: (conversationId) => `typing:${conversationId}:*`,
  rateMsgHourly: (userId) => `ratelimit:msg:${userId}`,
  rateMsgMinute: (userId) => `ratelimit:msg_min:${userId}`,
  rateFileHourly: (userId) => `ratelimit:file:${userId}`,
};

// Mark a user as online and store their presence metadata.
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

// Mark a user as offline.
// Keeps the presence record alive for 24 hours so "last seen" timestamps remain readable.
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

// Check whether a user is currently online.
// Returns true only when the presence record exists AND status === 'online'.
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

// Retrieve the full presence object for a user.
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

// Refresh the TTL on an existing online presence record.
// Should be called on every user action to prevent premature expiry.
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

// Record that a user has started typing in a conversation.
// Stores a TypingIndicator object with a 5-second TTL that auto-expires.
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

// Remove the typing indicator for a user in a conversation.
async function clearTyping(redisClient, conversationId, userId) {
  if (!conversationId || !userId) return;

  await redisClient.del(keys.typing(conversationId, userId));
}

// Get all users currently typing in a conversation.
// Uses SCAN to find all typing:<conversationId>:* keys without blocking Redis.
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

// Check whether a user is within their rate limit for a given action.
// Does NOT increment the counter – call incrementRateLimit() separately after a successful check.
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
    // Fail open – allow the request if Redis is unavailable
    return { allowed: true, current: 0, limit: max, resetInSeconds: 0 };
  }
}

// Increment the rate-limit counter for a user and return the updated state.
// On the first increment within a window the TTL is set automatically.
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

// Reset the rate-limit counter for a user (e.g. for testing or admin override).
async function resetRateLimit(redisClient, userId, limitType = 'message_hourly') {
  if (!userId) return;
  const { key } = _resolveLimitConfig(userId, limitType);
  await redisClient.del(key);
}

// Resolve the Redis key, max count, and TTL for a given limit type.
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
