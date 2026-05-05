'use strict';

/**
 * Room Manager
 *
 * Manages Socket.io conversation rooms.  Each room maps 1-to-1 with a
 * Conversation document and is identified by a deterministic room ID derived
 * from the doctorId and patientId.
 *
 * Responsibilities:
 *   - Generate stable, unique room IDs from a doctor-patient pair (Req 3.1)
 *   - Join a newly connected user to all their active conversation rooms (Req 2.3)
 *   - Validate whether a socket is currently in a given room (Req 3.2)
 *
 * Requirements: 2.3, 3.1, 3.2
 */

const { getUserConversations } = require('../models/Conversation.model');

// ─── Room ID ──────────────────────────────────────────────────────────────────

/**
 * Generate a deterministic, unique room ID for a doctor-patient conversation.
 *
 * The IDs are sorted lexicographically before joining so that
 * getRoomId(doctorId, patientId) === getRoomId(patientId, doctorId).
 * This prevents duplicate rooms if the function is ever called with the
 * arguments in the wrong order.
 *
 * Format: `chat:<lowerHex>:<upperHex>`
 *
 * @param {string} doctorId  - MongoDB ObjectId string of the doctor
 * @param {string} patientId - MongoDB ObjectId string of the patient
 * @returns {string} Stable room identifier
 *
 * Requirements: 3.1
 */
function getRoomId(doctorId, patientId) {
  if (!doctorId || !patientId) {
    throw new Error('getRoomId: both doctorId and patientId are required');
  }

  const a = doctorId.toString();
  const b = patientId.toString();

  // Lexicographic sort ensures symmetry
  const [first, second] = a < b ? [a, b] : [b, a];
  return `chat:${first}:${second}`;
}

// ─── Room membership ──────────────────────────────────────────────────────────

/**
 * Join a socket to all active conversation rooms for the authenticated user.
 *
 * Fetches every non-archived conversation the user participates in and calls
 * socket.join() for each corresponding room.  This is called once per
 * connection, immediately after authentication succeeds.
 *
 * @param {import('socket.io').Socket} socket   - Authenticated socket
 * @param {string}                     userId   - MongoDB ObjectId string
 * @param {'doctor'|'patient'}         userType - Role of the connecting user
 * @returns {Promise<string[]>} Array of room IDs the socket was joined to
 *
 * Requirements: 2.3
 */
async function joinUserRooms(socket, userId, userType) {
  if (!socket || !userId || !userType) {
    throw new Error('joinUserRooms: socket, userId, and userType are required');
  }

  const joinedRooms = [];

  try {
    // Fetch all active (non-archived) conversations for this user
    const { conversations } = await getUserConversations(userId, userType, {
      includeArchived: false,
      page: 1,
      limit: 200, // practical upper bound; most users have far fewer
    });

    for (const conversation of conversations) {
      const doctorId  = conversation.doctorId?._id?.toString()  || conversation.doctorId?.toString();
      const patientId = conversation.patientId?._id?.toString() || conversation.patientId?.toString();

      if (!doctorId || !patientId) continue;

      const roomId = getRoomId(doctorId, patientId);
      socket.join(roomId);
      joinedRooms.push(roomId);
    }

    console.log(
      `[RoomManager] ${userType} ${userId} joined ${joinedRooms.length} room(s)`
    );
  } catch (err) {
    // Non-fatal – log and continue.  The user can still send messages; they
    // just won't receive real-time broadcasts for conversations that failed
    // to load.
    console.error('[RoomManager] joinUserRooms error:', err.message);
  }

  return joinedRooms;
}

/**
 * Join a socket to a single conversation room.
 *
 * Used when a new conversation is created after the user has already connected,
 * or when a user explicitly opens a conversation for the first time.
 *
 * @param {import('socket.io').Socket} socket
 * @param {string} doctorId
 * @param {string} patientId
 * @returns {string} The room ID that was joined
 */
function joinRoom(socket, doctorId, patientId) {
  const roomId = getRoomId(doctorId, patientId);
  socket.join(roomId);
  return roomId;
}

/**
 * Remove a socket from a conversation room.
 *
 * @param {import('socket.io').Socket} socket
 * @param {string} doctorId
 * @param {string} patientId
 * @returns {string} The room ID that was left
 */
function leaveRoom(socket, doctorId, patientId) {
  const roomId = getRoomId(doctorId, patientId);
  socket.leave(roomId);
  return roomId;
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Check whether a socket is currently a member of a given room.
 *
 * Socket.io stores room membership in socket.rooms (a Set).
 *
 * @param {import('socket.io').Socket} socket
 * @param {string} roomId
 * @returns {boolean}
 *
 * Requirements: 3.2
 */
function isUserInRoom(socket, roomId) {
  if (!socket || !roomId) return false;
  return socket.rooms.has(roomId);
}

/**
 * Check whether a socket is in the room for a specific doctor-patient pair.
 *
 * Convenience wrapper around isUserInRoom + getRoomId.
 *
 * @param {import('socket.io').Socket} socket
 * @param {string} doctorId
 * @param {string} patientId
 * @returns {boolean}
 *
 * Requirements: 3.2
 */
function isUserInConversationRoom(socket, doctorId, patientId) {
  try {
    const roomId = getRoomId(doctorId, patientId);
    return isUserInRoom(socket, roomId);
  } catch (_) {
    return false;
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getRoomId,
  joinUserRooms,
  joinRoom,
  leaveRoom,
  isUserInRoom,
  isUserInConversationRoom,
};
