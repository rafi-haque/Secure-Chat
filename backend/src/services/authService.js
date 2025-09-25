const jwt = require('jsonwebtoken');
const User = require('../models/user');

class AuthService {
  /**
   * Generate JWT token for user
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    const payload = {
      userId: user._id,
      username: user.username
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '24h'
    });
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Verification result
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
      const user = await User.findById(decoded.userId);
      
      return {
        valid: true,
        user: user,
        decoded: decoded
      };
    } catch (error) {
      return {
        valid: false,
        user: null,
        error: 'Invalid token'
      };
    }
  }

  /**
   * Authenticate user with username and password
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object>} Authentication result
   */
  async authenticate(username, password) {
    try {
      const user = await User.findByUsername(username);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
          user: null,
          token: null
        };
      }

      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid password',
          user: null,
          token: null
        };
      }

      const token = this.generateToken(user);
      
      return {
        success: true,
        token: token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        user: null
      };
    }
  }

  /**
   * Authenticate user by username and return token
   * @param {string} username - Username
   * @returns {Promise<Object>} Authentication result
   */
  async authenticateUser(username) {
    try {
      const user = await User.findByUsername(username);
      if (!user) {
        throw new Error('User not found');
      }

      const token = this.generateToken(user);
      
      return {
        success: true,
        token: token,
        user: {
          id: user._id,
          username: user.username
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate user session
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Validation result
   */
  async validateSession(token) {
    try {
      const payload = this.verifyToken(token);
      const user = await User.findById(payload.userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        user: {
          id: user._id,
          username: user.username
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new AuthService();