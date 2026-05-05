/**
 * Chat Cache Service
 *
 * Centralises all Redis caching for the Doctor-Patient Chat System.
 * Provides a clean API for:
 *   - Active conversation caching (TTL: 30 minutes)
 *   - Unread count caching with database sync (TTL: 30 minutes)
 *   - User presence caching (TTL: 5 minutes)
 *   - Cache invalidation on updates
 *
 * All methods degrade gracefully when Redis is unavailable — callers
 * receive null/undefined and fall back to the database.
 *
 * Requirements: 20.6, 11.7
 */

'use strict';

const { redis } = require('../configs/redis');

// ─── TTL constants (seconds) ──────────────────────────────────────────────────

const TTL = {
  CONVERSATION: 30 * 60,   // 30 minutes  (Req 20.6)
  UNREAD_COUNT: 30 * 60,   // 30 minutes  (Req 11.7)
  PRESENCE:      5 * 60,   // 5 minutes   (Req 20.6)
  CONVERSATION_LIST: 5 * 60, // 5 minutes – shorter because list changes often
};

// ─── Key builders ─────────────────────────────────────────────────────────────

const keys = {
  conversation:     (id)           => `chat:conv:${id}`,
  conversationList: (userId, type) => `chat:convlist:${userId}:${type}`,
  unreadCount:      (convId, role) => `chat:unread:${convId}:${role}`,
  totalUnread:      (userId, type) => `chat:totalunread:${userId}:${type}`,
  presence:         (userId)       => `presence:${userId}`,
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Safely execute a Redis operation. Returns null on any error so callers
 * can fall back to the database without crashing.
 */
async function safeRedis(fn) {
  try {
    return await fn();
  } catch (err) {
    // Log but do not propagate — cache failures are non-fatal
    console.warn('[chatCacheService] Redis operation failed:', err.message);
    return null;
  }
}

function serialize(data) {
  return JSON.stringify(data);
}

function deserialize(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATION CACHE  (TTL: 30 minutes)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Cache a single conversation document.
 *
 * @param {string} conversationId
 * @param {object} conversation   - Mongoose document or plain object
 * @param {number} [ttl]          - Override TTL in seconds
 */
async function cacheConversation(conversationId, conversation, ttl = TTL.CONVERSATION) {
  if (!conversationId || !conversation) return;
  const data = typeof conversation.toObject === 'function'
    ? conversation.toObject()
    : conversation;
  await safeRedis(() => redis.setex(keys.conversation(conversationId), ttl, serialize(data)));
}

/**
 * Retrieve a cached conversation.
 *
 * @param {string} conversationId
 * @returns {Promise<object|null>} Cached conversation or null on miss/error
 */
async function getCachedConversation(conversationId) {
  if (!conversationId) return null;
  const raw = await safeRedis(() => redis.get(keys.conversation(conversationId)));
  return deserialize(raw);
}

/**
 * Invalidate the cache for a single conversation.
 * Call this whenever the conversation document is mutated.
 *
 * @param {string} conversationId
 */
async function invalidateConversation(conversationId) {
  if (!conversationId) return;
  await safeRedis(() => redis.del(keys.conversation(conversationId)));
}

// ─── Conversation list cache ──────────────────────────────────────────────────

/**
 * Cache the conversation list for a user.
 *
 * @param {string} userId
 * @param {'doctor'|'patient'} userType
 * @param {object} listData  - { conversations, pagination }
 * @param {number} [ttl]
 */
async function cacheConversationList(userId, userType, listData, ttl = TTL.CONVERSATION_LIST) {
  if (!userId || !userType || !listData) return;
  await safeRedis(() =>
    redis.setex(keys.conversationList(userId, userType), ttl, serialize(listData))
  );
}

/**
 * Retrieve a cached conversation list.
 *
 * @param {string} userId
 * @param {'doctor'|'patient'} userType
 * @returns {Promise<object|null>}
 */
async function getCachedConversationList(userId, userType) {
  if (!userId || !userType) return null;
  const raw = await safeRedis(() => redis.get(keys.conversationList(userId, userType)));
  return deserialize(raw);
}

/**
 * Invalidate the conversation list cache for a user.
 * Call this when a conversation is created, archived, or receives a new message.
 *
 * @param {string} userId
 * @param {'doctor'|'patient'} userType
 */
async function invalidateConversationList(userId, userType) {
  if (!userId || !userType) return;
  await safeRedis(() => redis.del(keys.conversationList(userId, userType)));
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNREAD COUNT CACHE  (TTL: 30 minutes, synced with DB)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Cache the unread count for a specific user role in a conversation.
 *
 * @param {string} conversationId
 * @param {'doctor'|'patient'} role
 * @param {number} count
 * @param {number} [ttl]
 */
async function cacheUnreadCount(conversationId, role, count, ttl = TTL.UNREAD_COUNT) {
  if (!conversationId || !role) return;
  await safeRedis(() =>
    redis.setex(keys.unreadCount(conversationId, role), ttl, String(count))
  );
}

/**
 * Retrieve the cached unread count for a user role in a conversation.
 *
 * @param {string} conversationId
 * @param {'doctor'|'patient'} role
 * @returns {Promise<number|null>} Count or null on cache miss
 */
async function getCachedUnreadCount(conversationId, role) {
  if (!conversationId || !role) return null;
  const raw = await safeRedis(() => redis.get(keys.unreadCount(conversationId, role)));
  if (raw === null || raw === undefined) return null;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Atomically increment the cached unread count.
 * If the key does not exist, it is initialised to 1.
 *
 * @param {string} conversationId
 * @param {'doctor'|'patient'} role
 * @returns {Promise<number|null>} New count or null on error
 */
async function incrementCachedUnreadCount(conversationId, role) {
  if (!conversationId || !role) return null;
  return safeRedis(async () => {
    const k = keys.unreadCount(conversationId, role);
    const newVal = await redis.incr(k);
    // Refresh TTL on every increment
    await redis.expire(k, TTL.UNREAD_COUNT);
    return newVal;
  });
}

/**
 * Atomically decrement the cached unread count (floor at 0).
 *
 * @param {string} conversationId
 * @param {'doctor'|'patient'} role
 * @returns {Promise<number|null>} New count or null on error
 */
async function decrementCachedUnreadCount(conversationId, role) {
  if (!conversationId || !role) return null;
  return safeRedis(async () => {
    const k = keys.unreadCount(conversationId, role);
    const current = await redis.get(k);
    const currentVal = current !== null ? parseInt(current, 10) : 0;
    const newVal = Math.max(0, currentVal - 1);
    await redis.setex(k, TTL.UNREAD_COUNT, String(newVal));
    return newVal;
  });
}

/**
 * Reset the cached unread count to zero.
 *
 * @param {string} conversationId
 * @param {'doctor'|'patient'} role
 */
async function resetCachedUnreadCount(conversationId, role) {
  if (!conversationId || !role) return;
  await safeRedis(() =>
    redis.setex(keys.unreadCount(conversationId, role), TTL.UNREAD_COUNT, '0')
  );
}

/**
 * Invalidate the unread count cache for a conversation/role pair.
 *
 * @param {string} conversationId
 * @param {'doctor'|'patient'} role
 */
async function invalidateUnreadCount(conversationId, role) {
  if (!conversationId || !role) return;
  await safeRedis(() => redis.del(keys.unreadCount(conversationId, role)));
}

// ─── Total unread count cache ─────────────────────────────────────────────────

/**
 * Cache the total unread count for a user across all conversations.
 *
 * @param {string} userId
 * @param {'doctor'|'patient'} userType
 * @param {number} count
 * @param {number} [ttl]
 */
async function cacheTotalUnreadCount(userId, userType, count, ttl = TTL.UNREAD_COUNT) {
  if (!userId || !userType) return;
  await safeRedis(() =>
    redis.setex(keys.totalUnread(userId, userType), ttl, String(count))
  );
}

/**
 * Retrieve the cached total unread count for a user.
 *
 * @param {string} userId
 * @param {'doctor'|'patient'} userType
 * @returns {Promise<number|null>}
 */
async function getCachedTotalUnreadCount(userId, userType) {
  if (!userId || !userType) return null;
  const raw = await safeRedis(() => redis.get(keys.totalUnread(userId, userType)));
  if (raw === null || raw === undefined) return null;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Invalidate the total unread count cache for a user.
 *
 * @param {string} userId
 * @param {'doctor'|'patient'} userType
 */
async function invalidateTotalUnreadCount(userId, userType) {
  if (!userId || !userType) return;
  await safeRedis(() => redis.del(keys.totalUnread(userId, userType)));
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER PRESENCE CACHE  (TTL: 5 minutes)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Set a user's presence status in Redis.
 *
 * @param {string} userId
 * @param {object} presenceData  - { status, socketId, userType, lastSeen, activeConversations }
 * @param {number} [ttl]         - Override TTL in seconds (default: 5 minutes)
 */
async function setUserPresence(userId, presenceData, ttl = TTL.PRESENCE) {
  if (!userId || !presenceData) return;
  const data = { ...presenceData, lastSeen: Date.now() };
  await safeRedis(() => redis.setex(keys.presence(userId), ttl, serialize(data)));
}

/**
 * Retrieve a user's presence data.
 *
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
async function getUserPresence(userId) {
  if (!userId) return null;
  const raw = await safeRedis(() => redis.get(keys.presence(userId)));
  return deserialize(raw);
}

/**
 * Check if a user is currently online.
 *
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function isUserOnline(userId) {
  if (!userId) return false;
  const presence = await getUserPresence(userId);
  return presence?.status === 'online';
}

/**
 * Remove a user's presence entry (mark as offline).
 *
 * @param {string} userId
 */
async function removeUserPresence(userId) {
  if (!userId) return;
  await safeRedis(() => redis.del(keys.presence(userId)));
}

/**
 * Refresh the TTL on a user's presence entry (called on any user activity).
 *
 * @param {string} userId
 * @param {number} [ttl]
 */
async function refreshPresenceTTL(userId, ttl = TTL.PRESENCE) {
  if (!userId) return;
  await safeRedis(async () => {
    const k = keys.presence(userId);
    const exists = await redis.exists(k);
    if (exists) {
      await redis.expire(k, ttl);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// BULK INVALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Invalidate all caches related to a conversation.
 * Call this when a message is sent, conversation is updated, etc.
 *
 * @param {string} conversationId
 * @param {string} doctorId
 * @param {string} patientId
 */
async function invalidateConversationCaches(conversationId, doctorId, patientId) {
  await Promise.all([
    invalidateConversation(conversationId),
    doctorId   ? invalidateConversationList(doctorId, 'doctor')   : Promise.resolve(),
    patientId  ? invalidateConversationList(patientId, 'patient') : Promise.resolve(),
    doctorId   ? invalidateTotalUnreadCount(doctorId, 'doctor')   : Promise.resolve(),
    patientId  ? invalidateTotalUnreadCount(patientId, 'patient') : Promise.resolve(),
  ]);
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  // Conversation
  cacheConversation,
  getCachedConversation,
  invalidateConversation,

  // Conversation list
  cacheConversationList,
  getCachedConversationList,
  invalidateConversationList,

  // Unread counts
  cacheUnreadCount,
  getCachedUnreadCount,
  incrementCachedUnreadCount,
  decrementCachedUnreadCount,
  resetCachedUnreadCount,
  invalidateUnreadCount,

  // Total unread
  cacheTotalUnreadCount,
  getCachedTotalUnreadCount,
  invalidateTotalUnreadCount,

  // Presence
  setUserPresence,
  getUserPresence,
  isUserOnline,
  removeUserPresence,
  refreshPresenceTTL,

  // Bulk
  invalidateConversationCaches,

  // Expose TTL constants for use in other modules
  TTL,
  keys,
};
