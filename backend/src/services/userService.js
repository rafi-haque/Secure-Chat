const User = require('../models/user');

class UserService {
  /**
   * Create a new user
   * @param {Object} userData - User data object
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    try {
      const user = new User(userData);
      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} User object
   */
  async findByEmail(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      return user;
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  /**
   * Find user by email (alias for findByEmail)
   * @param {string} email - User email
   * @returns {Promise<Object>} User object
   */
  async findUserByEmail(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      return user;
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  /**
   * Update user status
   * @param {string} userId - User ID
   * @param {boolean} isActive - Active status
   * @returns {Promise<Object>} Updated user
   */
  async updateUserStatus(userId, isActive) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { isActive: isActive, lastSeen: new Date() },
        { new: true }
      );
      return user;
    } catch (error) {
      throw new Error(`Failed to update user status: ${error.message}`);
    }
  }

  /**
   * Get online users
   * @returns {Promise<Array>} List of online users
   */
  async getOnlineUsers() {
    try {
      return await User.find({ isActive: true }).select('username -_id');
    } catch (error) {
      throw new Error(`Failed to get online users: ${error.message}`);
    }
  }

  /**
   * Find user by username
   * @param {string} username - Username to search for
   * @returns {Promise<Object|null>} User object or null
   */
  async findUserByUsername(username) {
    return await User.findOne({ username });
  }



  /**
   * Find user by ID
   * @param {string} userId - User ID to search for
   * @returns {Promise<Object|null>} User object or null
   */
  async findUserById(userId) {
    return await User.findById(userId);
  }



  /**
   * Search users by username pattern
   * @param {string} pattern - Search pattern
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Array>} Array of matching users
   */
  async searchUsers(pattern, limit = 10) {
    return await User.findByUsernamePattern(pattern).limit(limit);
  }

  /**
   * Update user's last active timestamp
   * @param {string} username - Username
   * @returns {Promise<Object>} Updated user object
   */
  async updateLastActive(username) {
    const user = await this.findUserByUsername(username);
    if (user) {
      return await user.updateLastActive();
    }
    return null;
  }

  /**
   * Delete user by username
   * @param {string} username - Username to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteUser(username) {
    const result = await User.deleteOne({ username });
    return result.deletedCount > 0;
  }

  /**
   * Get user's public key
   * @param {string} username - Username
   * @returns {Promise<string|null>} Public key or null
   */
  async getPublicKey(username) {
    const user = await User.findOne({ username }).select('publicKey');
    return user ? user.publicKey : null;
  }
}

module.exports = new UserService();