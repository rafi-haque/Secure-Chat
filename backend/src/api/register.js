const express = require('express');
const KeyDirectoryService = require('../services/keyDirectory');

const router = express.Router();
const keyDirectoryService = new KeyDirectoryService();

/**
 * POST /api/register
 * Register a new user with username and public key
 */
router.post('/register', async (req, res) => {
  try {
    const { username, publicKey } = req.body;

    // Validate request body
    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Public key is required'
      });
    }

    // Validate username format
    if (!KeyDirectoryService.isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        error: 'Username must be 3-30 characters long and contain only letters, numbers, and underscores'
      });
    }

    // Validate public key (basic check)
    if (typeof publicKey !== 'string' || publicKey.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid public key format'
      });
    }

    // Register user
    const result = await keyDirectoryService.registerUser(username, publicKey);

    res.status(201).json(result);

  } catch (error) {
    console.error('Registration error:', error);

    if (error.message === 'Username already exists') {
      return res.status(409).json({
        success: false,
        error: 'Username already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

module.exports = router;