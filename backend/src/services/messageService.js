const Message = require('../models/Message');

class MessageService {
  /**
   * Create a new message
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Created message
   */
  async createMessage(messageData) {
    try {
      // Map field names from test format to model format
      const mappedData = {
        ...messageData,
        sender: messageData.senderId || messageData.sender,
        room: messageData.roomId || messageData.room,
        recipient: messageData.recipientId || messageData.recipient
      };
      
      // Remove the old field names if they exist
      delete mappedData.senderId;
      delete mappedData.roomId;
      delete mappedData.recipientId;
      
      const message = new Message(mappedData);
      await message.save();
      return message;
    } catch (error) {
      throw new Error(`Failed to create message: ${error.message}`);
    }
  }

  /**
   * Get messages for a room
   * @param {string} roomId - Room ID
   * @param {number} limit - Number of messages to retrieve
   * @returns {Promise<Array>} Array of messages
   */
  async getMessagesByRoom(roomId, limit = 50) {
    try {
      const messages = await Message.find({ room: roomId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('sender', 'username');
      
      return messages.reverse(); // Return in chronological order
    } catch (error) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  }

  /**
   * Mark message as delivered
   * @param {string} messageId - Message ID
   * @param {string} recipientId - Recipient user ID
   * @returns {Promise<Object>} Update result
   */
  async markAsDelivered(messageId, recipientId) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      if (!message.deliveredTo.includes(recipientId)) {
        message.deliveredTo.push(recipientId);
        await message.save();
      }

      return {
        success: true,
        message: message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get messages for a room (alias for getMessagesByRoom)
   * @param {string} roomId - Room ID
   * @param {number} limit - Number of messages to retrieve
   * @returns {Promise<Array>} Array of messages
   */
  async getMessagesForRoom(roomId, limit = 50) {
    return this.getMessagesByRoom(roomId, limit);
  }

  /**
   * Get message history with pagination
   * @param {string} roomId - Room ID
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of messages per page
   * @returns {Promise<Object>} Paginated messages
   */
  async getMessageHistory(roomId, page = 1, limit = 50) {
    try {
      const skip = (page - 1) * limit;
      const totalMessages = await Message.countDocuments({ 
        room: roomId, 
        isDeleted: false 
      });
      
      const messages = await Message.find({ 
        room: roomId, 
        isDeleted: false 
      })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'username');
      
      const totalPages = Math.ceil(totalMessages / limit);
      
      return {
        messages: messages.reverse(), // Return in chronological order
        currentPage: page,
        totalPages: totalPages,
        totalMessages: totalMessages
      };
    } catch (error) {
      throw new Error(`Failed to get message history: ${error.message}`);
    }
  }

  /**
   * Delete a message (soft delete)
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID requesting deletion
   * @returns {Promise<Object>} Deletion result
   */
  async deleteMessage(messageId, userId = null) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Only check authorization if userId is provided
      if (userId && message.sender.toString() !== userId.toString()) {
        throw new Error('Unauthorized to delete this message');
      }

      message.isDeleted = true;
      await message.save();
      
      return message;
    } catch (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }
}

module.exports = new MessageService();