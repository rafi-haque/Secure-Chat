const { Server } = require('socket.io');

class WebSocketHandler {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // username -> socket.id mapping
    this.userSockets = new Map(); // socket.id -> user data mapping
  }

  /**
   * Initialize WebSocket server
   * @param {http.Server} httpServer - HTTP server instance
   * @param {Object} corsOptions - CORS configuration
   */
  initialize(httpServer, corsOptions = {}) {
    this.io = new Server(httpServer, {
      cors: {
        origin: corsOptions.origin || process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupEventHandlers();
    console.log('WebSocket server initialized');
  }

  /**
   * Setup WebSocket event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', (authData) => {
        this.handleAuthentication(socket, authData);
      });

      // Handle message sending
      socket.on('sendMessage', (messageData) => {
        this.handleMessageSend(socket, messageData);
      });

      // Handle message delivery confirmation
      socket.on('messageReceived', (confirmationData) => {
        this.handleMessageReceived(socket, confirmationData);
      });

      // Handle typing indicators
      socket.on('typing', (typingData) => {
        this.handleTyping(socket, typingData);
      });

      // Handle user disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });

      // Handle connection errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Handle user authentication
   * @param {Socket} socket - Socket instance
   * @param {Object} authData - Authentication data
   */
  handleAuthentication(socket, authData) {
    try {
      const { username } = authData;

      if (!username) {
        socket.emit('authError', { error: 'Username is required' });
        return;
      }

      // Store user data
      this.connectedUsers.set(username, socket.id);
      this.userSockets.set(socket.id, {
        username,
        connectedAt: new Date()
      });

      socket.emit('authenticated', {
        success: true,
        username
      });

      console.log(`User authenticated: ${username} (${socket.id})`);

    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('authError', { error: 'Authentication failed' });
    }
  }

  /**
   * Handle message sending
   * @param {Socket} socket - Sender's socket
   * @param {Object} messageData - Message data
   */
  handleMessageSend(socket, messageData) {
    try {
      console.log('Received sendMessage event:', { messageData, socketId: socket.id });
      const senderData = this.userSockets.get(socket.id);
      if (!senderData) {
        console.log('Socket not authenticated:', socket.id);
        socket.emit('error', { error: 'Not authenticated' });
        return;
      }

      const { to, encryptedContent, timestamp, id } = messageData;

      if (!to || !encryptedContent) {
        socket.emit('error', { error: 'Recipient and message content are required' });
        return;
      }

      // Use message ID from client or generate new one
      const messageId = id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const messagePayload = {
        id: messageId,
        from: senderData.username,
        to,
        content: encryptedContent,
        timestamp: timestamp || Date.now(),
        deliveredAt: Date.now()
      };

      // Find recipient's socket
      const recipientSocketId = this.connectedUsers.get(to);

      if (recipientSocketId) {
        // Recipient is online - deliver message
        this.io.to(recipientSocketId).emit('message', messagePayload);

        // Send delivery confirmation to sender
        socket.emit('messageDelivered', {
          messageId,
          status: 'delivered',
          timestamp: Date.now()
        });

        console.log(`Message delivered: ${senderData.username} -> ${to}`);
      } else {
        // Recipient is offline - send failure notification
        socket.emit('messageDelivered', {
          messageId,
          status: 'failed',
          error: 'Recipient is offline',
          timestamp: Date.now()
        });

        console.log(`Message failed (recipient offline): ${senderData.username} -> ${to}`);
      }

    } catch (error) {
      console.error('Message send error:', error);
      socket.emit('error', { error: 'Message send failed' });
    }
  }

  /**
   * Handle message received confirmation
   * @param {Socket} socket - Receiver's socket
   * @param {Object} confirmationData - Confirmation data
   */
  handleMessageReceived(socket, confirmationData) {
    try {
      const receiverData = this.userSockets.get(socket.id);
      if (!receiverData) {
        return;
      }

      const { messageId, from } = confirmationData;

      // Find sender's socket and send read confirmation
      const senderSocketId = this.connectedUsers.get(from);
      if (senderSocketId) {
        this.io.to(senderSocketId).emit('messageRead', {
          messageId,
          readBy: receiverData.username,
          timestamp: Date.now()
        });
      }

    } catch (error) {
      console.error('Message received confirmation error:', error);
    }
  }

  /**
   * Handle typing indicators
   * @param {Socket} socket - Sender's socket
   * @param {Object} typingData - Typing data
   */
  handleTyping(socket, typingData) {
    try {
      const senderData = this.userSockets.get(socket.id);
      if (!senderData) {
        return;
      }

      const { to, isTyping } = typingData;

      // Find recipient's socket
      const recipientSocketId = this.connectedUsers.get(to);
      if (recipientSocketId) {
        this.io.to(recipientSocketId).emit('userTyping', {
          from: senderData.username,
          isTyping
        });
      }

    } catch (error) {
      console.error('Typing indicator error:', error);
    }
  }

  /**
   * Handle user disconnection
   * @param {Socket} socket - Disconnected socket
   */
  handleDisconnection(socket) {
    try {
      const userData = this.userSockets.get(socket.id);
      
      if (userData) {
        // Remove user from connected users
        this.connectedUsers.delete(userData.username);
        this.userSockets.delete(socket.id);

        console.log(`User disconnected: ${userData.username} (${socket.id})`);
      } else {
        console.log(`Client disconnected: ${socket.id}`);
      }

    } catch (error) {
      console.error('Disconnection handling error:', error);
    }
  }

  /**
   * Get connected users count
   * @returns {number} Number of connected users
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get list of connected usernames
   * @returns {Array<string>} Array of connected usernames
   */
  getConnectedUsernames() {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Check if user is online
   * @param {string} username - Username to check
   * @returns {boolean} True if user is online
   */
  isUserOnline(username) {
    return this.connectedUsers.has(username);
  }
}

module.exports = WebSocketHandler;