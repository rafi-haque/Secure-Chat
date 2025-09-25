const User = require('../models/user');

class KeyDirectoryService {
  /**
   * Register a new user with username and public key
   * @param {string} username - The unique username
   * @param {string} publicKey - The user's public key
   * @returns {Promise<Object>} Registration result
   */
  async registerUser(username, publicKey) {
    try {
      // Validate input
      if (!username || !publicKey) {
        throw new Error('Username and public key are required');
      }

      // Check if username already exists
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Create new user
      const user = new User({
        username: username.trim(),
        publicKey: publicKey.trim()
      });

      await user.save();

      return {
        success: true,
        message: 'User registered successfully',
        username: user.username
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get public key for a username
   * @param {string} username - The username to lookup
   * @returns {Promise<Object>} User data with public key
   */
  async getPublicKey(username) {
    const user = await User.findByUsername(username);
    return user ? user.publicKey : null;
  }

  /**
   * Search for users by username pattern
   * @param {string} query - Search query
   * @returns {Promise<Object>} Search results
   */
  async searchUsers(query) {
    if (!query || query.trim().length === 0) {
      return {
        success: true,
        users: []
      };
    }

    const users = await User.searchByUsername(query.trim());
    
    return {
      success: true,
      users: users.map(user => ({
        username: user.username
      }))
    };
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats() {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    return {
      success: true,
      totalUsers,
      activeUsers
    };
  }

  /**
   * Validate username format
   * @param {string} username - Username to validate
   * @returns {boolean} True if valid
   */
  static isValidUsername(username) {
    if (!username || typeof username !== 'string') {
      return false;
    }

    const trimmedUsername = username.trim();
    
    // Check length
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      return false;
    }

    // Check format (alphanumeric and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(trimmedUsername);
  }
}

module.exports = KeyDirectoryService;