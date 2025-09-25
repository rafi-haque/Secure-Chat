const Room = require('../models/Room');
const User = require('../models/user');

class RoomService {
  /**
   * Create a new room
   * @param {Object} roomData - Room data
   * @returns {Promise<Object>} Created room
   */
  async createRoom(roomData) {
    try {
      // If createdBy is not provided, use the first participant
      if (!roomData.createdBy && roomData.participants && roomData.participants.length > 0) {
        roomData.createdBy = roomData.participants[0];
      }
      
      const room = new Room(roomData);
      await room.save();
      return room;
    } catch (error) {
      throw new Error(`Failed to create room: ${error.message}`);
    }
  }

  /**
   * Get room by ID
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Room data
   */
  async getRoomById(roomId) {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error('Room not found');
      }
      return room;
    } catch (error) {
      throw new Error(`Failed to get room: ${error.message}`);
    }
  }

  /**
   * Get rooms for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of rooms
   */
  async getRoomsForUser(userId) {
    try {
      const rooms = await Room.find({
        participants: userId
      }).sort({ lastActivity: -1 });
      
      return rooms;
    } catch (error) {
      throw new Error(`Failed to get user rooms: ${error.message}`);
    }
  }

  /**
   * Add participant to room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID to add
   * @returns {Promise<Object>} Update result
   */
  async addParticipant(roomId, userId) {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      if (!room.participants.includes(userId)) {
        room.participants.push(userId);
        room.lastActivity = new Date();
        await room.save();
      }

      return room;
    } catch (error) {
      throw new Error(`Failed to add participant: ${error.message}`);
    }
  }

  /**
   * Remove participant from room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID to remove
   * @returns {Promise<Object>} Update result
   */
  async removeParticipant(roomId, userId) {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      room.participants = room.participants.filter(p => p.toString() !== userId.toString());
      room.lastActivity = new Date();
      await room.save();

      return room;
    } catch (error) {
      throw new Error(`Failed to remove participant: ${error.message}`);
    }
  }

  /**
   * Update room activity timestamp
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Update result
   */
  async updateActivity(roomId) {
    try {
      const room = await Room.findByIdAndUpdate(
        roomId,
        { lastActivity: new Date() },
        { new: true }
      );
      
      if (!room) {
        throw new Error('Room not found');
      }

      return {
        success: true,
        room: room
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate room passcode
   * @param {string} roomId - Room ID
   * @param {string} passcode - Passcode to validate
   * @returns {Promise<boolean>} True if passcode is valid
   */
  async validateRoomPasscode(roomId, passcode) {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error('Room not found');
      }
      
      // If room has no passcode, any passcode is invalid
      if (!room.passcode) {
        return false;
      }
      
      return room.passcode === passcode;
    } catch (error) {
      throw new Error(`Failed to validate passcode: ${error.message}`);
    }
  }
}

module.exports = new RoomService();