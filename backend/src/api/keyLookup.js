const express = require('express');
const KeyDirectoryService = require('../services/keyDirectory');

const router = express.Router();
const keyDirectoryService = new KeyDirectoryService();

/**
 * GET /api/users/:username/publickey
 * Get public key for a specific username
 */
router.get('/users/:username/publickey', async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }

    const publicKey = await keyDirectoryService.getPublicKey(username);
    
    if (!publicKey) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      username: username,
      publicKey: publicKey
    });

  } catch (error) {
    console.error('Public key lookup error:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Public key lookup failed'
    });
  }
});

/**
 * GET /api/users/search/:query
 * Search for users by username pattern
 */
router.get('/users/search/:query', async (req, res) => {
  try {
    const { query } = req.params;

    if (!query || query.trim().length === 0) {
      return res.status(200).json({
        success: true,
        users: []
      });
    }

    // Validate query length (prevent very short searches that return too many results)
    if (query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }

    const result = await keyDirectoryService.searchUsers(query);
    res.status(200).json(result);

  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({
      success: false,
      error: 'User search failed'
    });
  }
});

/**
 * GET /api/users/stats
 * Get user statistics (for admin/monitoring purposes)
 */
router.get('/users/stats', async (req, res) => {
  try {
    const result = await keyDirectoryService.getUserStats();
    res.status(200).json(result);

  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user statistics'
    });
  }
});

module.exports = router;