
const { getUserConversations } = require('../models/Conversation.model');

// Generate a deterministic, unique room ID for a doctor-patient conversation.
// IDs are sorted lexicographically so getRoomId(a, b) === getRoomId(b, a).
// Format: chat:<lowerHex>:<upperHex>
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

// Join a socket to all active conversation rooms for the authenticated user.
// Fetches every non-archived conversation the user participates in and calls
// socket.join() for each corresponding room.
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
    // Non-fatal – log and continue.
    console.error('[RoomManager] joinUserRooms error:', err.message);
  }

  return joinedRooms;
}

// Join a socket to a single conversation room.
function joinRoom(socket, doctorId, patientId) {
  const roomId = getRoomId(doctorId, patientId);
  socket.join(roomId);
  return roomId;
}

// Remove a socket from a conversation room.
function leaveRoom(socket, doctorId, patientId) {
  const roomId = getRoomId(doctorId, patientId);
  socket.leave(roomId);
  return roomId;
}

// Check whether a socket is currently a member of a given room.
function isUserInRoom(socket, roomId) {
  if (!socket || !roomId) return false;
  return socket.rooms.has(roomId);
}

// Convenience wrapper around isUserInRoom + getRoomId.
function isUserInConversationRoom(socket, doctorId, patientId) {
  try {
    const roomId = getRoomId(doctorId, patientId);
    return isUserInRoom(socket, roomId);
  } catch (_) {
    return false;
  }
}

module.exports = {
  getRoomId,
  joinUserRooms,
  joinRoom,
  leaveRoom,
  isUserInRoom,
  isUserInConversationRoom,
};
