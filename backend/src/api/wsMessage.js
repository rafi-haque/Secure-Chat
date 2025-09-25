const express = require('express');

const router = express.Router();

/**
 * WebSocket messaging is handled by the WebSocketHandler service
 * This file provides HTTP endpoints for WebSocket-related operations
 */

/**
 * GET /api/websocket/status
 * Get WebSocket server status
 */
router.get('/websocket/status', (req, res) => {
  try {
    // Access WebSocket handler from app locals (set in main server)
    const wsHandler = req.app.locals.wsHandler;
    
    if (!wsHandler) {
      return res.status(503).json({
        success: false,
        error: 'WebSocket service not available'
      });
    }

    res.status(200).json({
      success: true,
      status: 'active',
      connectedUsers: wsHandler.getConnectedUsersCount(),
      connectedUsernames: wsHandler.getConnectedUsernames()
    });

  } catch (error) {
    console.error('WebSocket status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get WebSocket status'
    });
  }
});

/**
 * GET /api/websocket/user/:username/status
 * Check if a specific user is online
 */
router.get('/websocket/user/:username/status', (req, res) => {
  try {
    const { username } = req.params;
    const wsHandler = req.app.locals.wsHandler;

    if (!wsHandler) {
      return res.status(503).json({
        success: false,
        error: 'WebSocket service not available'
      });
    }

    const isOnline = wsHandler.isUserOnline(username);

    res.status(200).json({
      success: true,
      username,
      isOnline,
      checkedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('User status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check user status'
    });
  }
});

/**
 * POST /api/websocket/broadcast
 * Send a broadcast message to all connected users (admin only)
 * This is for system announcements, maintenance notifications, etc.
 */
router.post('/websocket/broadcast', (req, res) => {
  try {
    const { message, type = 'announcement' } = req.body;
    const wsHandler = req.app.locals.wsHandler;

    if (!wsHandler || !wsHandler.io) {
      return res.status(503).json({
        success: false,
        error: 'WebSocket service not available'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Broadcast to all connected clients
    wsHandler.io.emit('systemBroadcast', {
      type,
      message,
      timestamp: Date.now(),
      broadcastId: `broadcast_${Date.now()}`
    });

    res.status(200).json({
      success: true,
      message: 'Broadcast sent successfully',
      recipientCount: wsHandler.getConnectedUsersCount()
    });

  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send broadcast'
    });
  }
});

module.exports = router;