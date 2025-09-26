const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Client = require('socket.io-client');

describe('WebSocket Messaging Contract Tests', () => {
  let app, httpServer, mongoServer;

  beforeAll(async () => {
    // Setup in-memory MongoDB for testing
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = mongoUri;
    
    await mongoose.connect(mongoUri);

    // Import server module after database is connected
    const serverModule = require('../../src/server');
    app = serverModule.app;
    httpServer = serverModule.server;
    
    // Start the server for testing
    await new Promise((resolve) => {
      httpServer.listen(0, resolve); // Use port 0 for random available port
    });
  });

  afterAll(async () => {
    if (httpServer) {
      httpServer.close();
    }
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('WebSocket Connection and Messaging', () => {

    it('should establish WebSocket connection successfully', (done) => {
      const port = httpServer.address().port;
      const clientSocket = new Client(`http://localhost:${port}`);
      
      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        clientSocket.disconnect();
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should handle user authentication on connection', (done) => {
      const port = httpServer.address().port;
      const clientSocket = new Client(`http://localhost:${port}`);

      clientSocket.on('connect', () => {
        // Test actual WebSocket handler authentication
        clientSocket.emit('authenticate', { username: 'testuser' });
      });

      clientSocket.on('authenticated', (authResponse) => {
        expect(authResponse.success).toBe(true);
        expect(authResponse.username).toBe('testuser');
        clientSocket.disconnect();
        done();
      });

      clientSocket.on('authError', (error) => {
        done(error);
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should handle encrypted message sending and receiving', (done) => {
      const port = httpServer.address().port;
      
      // Create sockets
      const senderSocket = new Client(`http://localhost:${port}`);
      const receiverSocket = new Client(`http://localhost:${port}`);

      let senderAuthenticated = false;
      let receiverAuthenticated = false;

      const checkBothReady = () => {
        if (senderAuthenticated && receiverAuthenticated) {
          // Both authenticated, send message
          const testMessage = {
            to: 'receiver',
            encryptedContent: 'encrypted-message-content',
            timestamp: Date.now()
          };

          receiverSocket.on('message', (message) => {
            try {
              expect(message).toHaveProperty('from', 'sender');
              expect(message).toHaveProperty('content', 'encrypted-message-content');
              expect(message).toHaveProperty('timestamp');
              expect(message).toHaveProperty('id');
              done();
            } catch (error) {
              done(error);
            } finally {
              senderSocket.disconnect();
              receiverSocket.disconnect();
            }
          });

          senderSocket.emit('sendMessage', testMessage);
        }
      };

      // Sender connection and authentication
      senderSocket.on('connect', () => {
        senderSocket.emit('authenticate', { username: 'sender' });
      });

      senderSocket.on('authenticated', () => {
        senderAuthenticated = true;
        checkBothReady();
      });

      // Receiver connection and authentication  
      receiverSocket.on('connect', () => {
        receiverSocket.emit('authenticate', { username: 'receiver' });
      });

      receiverSocket.on('authenticated', () => {
        receiverAuthenticated = true;
        checkBothReady();
      });

      // Error handling
      senderSocket.on('connect_error', done);
      receiverSocket.on('connect_error', done);
      senderSocket.on('authError', done);
      receiverSocket.on('authError', done);
    });

    it('should handle delivery status confirmation', (done) => {
      const port = httpServer.address().port;
      const senderSocket = new Client(`http://localhost:${port}`);

      senderSocket.on('connect', () => {
        // Authenticate first
        senderSocket.emit('authenticate', { username: 'sender' });
      });

      senderSocket.on('authenticated', () => {
        const testMessage = {
          to: 'offline-receiver', // Use offline receiver to test failed delivery
          encryptedContent: 'test-message',
          timestamp: Date.now()
        };

        senderSocket.on('messageDelivered', (confirmation) => {
          expect(confirmation).toHaveProperty('messageId');
          expect(confirmation).toHaveProperty('status', 'failed'); // Should fail for offline receiver
          expect(confirmation).toHaveProperty('timestamp');
          expect(confirmation).toHaveProperty('error', 'Recipient is offline');
          senderSocket.disconnect();
          done();
        });

        senderSocket.emit('sendMessage', testMessage);
      });

      senderSocket.on('connect_error', done);
      senderSocket.on('authError', done);
    });

    it('should handle connection errors gracefully', (done) => {
      const port = httpServer.address().port;
      const clientSocket = new Client(`http://localhost:${port + 1}`); // Wrong port

      clientSocket.on('connect_error', (error) => {
        expect(error).toBeDefined();
        done();
      });

      // Timeout to ensure test doesn't hang
      setTimeout(() => {
        clientSocket.disconnect();
        done();
      }, 2000);
    });
  });
});