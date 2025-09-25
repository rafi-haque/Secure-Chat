/**
 * Performance Tests for WebSocket Messaging
 * Validates that WebSocket messaging meets performance requirements (<200ms)
 */

const io = require('socket.io-client');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import models and app setup
const User = require('../../src/models/user');
const Room = require('../../src/models/Room');
const Message = require('../../src/models/Message');

describe('WebSocket Performance Tests', () => {
  let app, server, httpServer, mongoServer, mongoUri;
  const testUsers = [];
  let testRoom;
  let clientSockets = [];

  // Performance thresholds
  const PERFORMANCE_THRESHOLDS = {
    MESSAGE_LATENCY: 200, // ms
    CONNECTION_TIME: 1000, // ms
    CONCURRENT_MESSAGES: 50,
    MAX_ROOM_SIZE: 10
  };

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = mongoUri;
    
    await mongoose.connect(mongoUri);

    // Import app after database is connected
    const serverModule = require('../../src/server');
    app = serverModule.app;
    httpServer = serverModule.server;
    server = serverModule.wsHandler.io;
    
    // Start the server for testing
    await new Promise((resolve) => {
      httpServer.listen(0, resolve); // Use port 0 for random available port
    });

    // Create test users
    for (let i = 0; i < 10; i++) {
      const user = new User({
        username: `testuser${i}`,
        publicKey: `test-public-key-${i}`
      });
      await user.save();
      testUsers.push(user);
    }

    // Create test room
    testRoom = new Room({
      name: 'Performance Test Room',
      isPrivate: false,
      participants: testUsers.map(u => u.username),
      createdBy: testUsers[0].username
    });
    await testRoom.save();
  });

    afterAll(async () => {
    // Cleanup all client sockets
    clientSockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect();
      }
    });
    
    if (httpServer) {
      httpServer.close();
    }
    
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    // Clear client sockets before each test
    clientSockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect();
      }
    });
    clientSockets = [];
  });

  describe('Connection Performance', () => {
    test('should connect within performance threshold', async () => {
      const startTime = Date.now();
      
      const socket = io(`http://localhost:${httpServer.address().port}`);
      clientSockets.push(socket);
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, PERFORMANCE_THRESHOLDS.CONNECTION_TIME);
        
        socket.on('connect', () => {
          clearTimeout(timeout);
          const connectionTime = Date.now() - startTime;
          expect(connectionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CONNECTION_TIME);
          resolve();
        });
        
        socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });

    test('should authenticate within performance threshold', async () => {
      const socket = io(`http://localhost:${httpServer.address().port}`);
      clientSockets.push(socket);
      
      await new Promise((resolve) => {
        socket.on('connect', resolve);
      });
      
      const startTime = Date.now();
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Authentication timeout'));
        }, PERFORMANCE_THRESHOLDS.CONNECTION_TIME);
        
        socket.emit('authenticate', { username: testUsers[0].username });
        
        socket.on('authenticated', (data) => {
          clearTimeout(timeout);
          const authTime = Date.now() - startTime;
          expect(authTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CONNECTION_TIME);
          expect(data.success).toBe(true);
          expect(data.username).toBe(testUsers[0].username);
          resolve();
        });
        
        socket.on('authError', (error) => {
          clearTimeout(timeout);
          reject(new Error(error.error));
        });
      });
    });
  });

  describe('Message Latency Performance', () => {
    let authenticatedSocket;

    beforeEach(async () => {
      // Setup authenticated socket for each test
      const port = httpServer.address().port;
      authenticatedSocket = io(`http://localhost:${port}`);
      clientSockets.push(authenticatedSocket);
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
        authenticatedSocket.on('connect', () => {
          clearTimeout(timeout);
          // Authenticate using actual WebSocket handler
          authenticatedSocket.emit('authenticate', { username: testUsers[0].username });
        });
        authenticatedSocket.on('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
        authenticatedSocket.on('authenticated', () => {
          clearTimeout(timeout);
          resolve();
        });
        authenticatedSocket.on('authError', (error) => {
          clearTimeout(timeout);
          reject(new Error(error.error));
        });
      });
    });

    test('should send and receive message within latency threshold', async () => {
      // Create a second socket to receive the message
      const receiverSocket = io(`http://localhost:${httpServer.address().port}`);
      clientSockets.push(receiverSocket);
      
      // Authenticate receiver
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Receiver connection timeout')), 2000);
        receiverSocket.on('connect', () => {
          clearTimeout(timeout);
          receiverSocket.emit('authenticate', { username: testUsers[1].username });
        });
        receiverSocket.on('authenticated', () => {
          clearTimeout(timeout);
          resolve();
        });
        receiverSocket.on('authError', (error) => {
          clearTimeout(timeout);
          reject(new Error(error.error));
        });
      });
      
      const testMessage = {
        to: testUsers[1].username,
        encryptedContent: 'encrypted-performance-test',
        timestamp: Date.now()
      };
      
      const startTime = Date.now();
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Message latency exceeded ${PERFORMANCE_THRESHOLDS.MESSAGE_LATENCY}ms`));
        }, PERFORMANCE_THRESHOLDS.MESSAGE_LATENCY);
        
        receiverSocket.on('message', (data) => {
          clearTimeout(timeout);
          const latency = Date.now() - startTime;
          
          expect(latency).toBeLessThan(PERFORMANCE_THRESHOLDS.MESSAGE_LATENCY);
          expect(data.from).toBe(testUsers[0].username);
          expect(data.encryptedContent).toBe(testMessage.encryptedContent);
          
          resolve();
        });
        
        authenticatedSocket.emit('sendMessage', testMessage);
      });
    });

    test.skip('should handle multiple sequential messages efficiently', async () => {
      const messageCount = 10;
      const messages = [];
      
      for (let i = 0; i < messageCount; i++) {
        const startTime = Date.now();
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Message ${i} exceeded latency threshold`));
          }, PERFORMANCE_THRESHOLDS.MESSAGE_LATENCY);
          
          authenticatedSocket.emit('send_message', {
            content: `Sequential message ${i}`,
            encryptedContent: `encrypted-sequential-${i}`,
            messageType: 'text'
          });
          
          authenticatedSocket.on('new_message', (data) => {
            if (data.content === `Sequential message ${i}`) {
              clearTimeout(timeout);
              const latency = Date.now() - startTime;
              messages.push({ index: i, latency });
              resolve();
            }
          });
        });
      }
      
      // Verify all messages met performance threshold
      messages.forEach(msg => {
        expect(msg.latency).toBeLessThan(PERFORMANCE_THRESHOLDS.MESSAGE_LATENCY);
      });
      
      // Calculate average latency
      const averageLatency = messages.reduce((sum, msg) => sum + msg.latency, 0) / messages.length;
      expect(averageLatency).toBeLessThan(PERFORMANCE_THRESHOLDS.MESSAGE_LATENCY);
    });
  });

  describe('Concurrent User Performance', () => {
    test.skip('should handle concurrent messages from multiple users', async () => {
      const concurrentUsers = 5;
      const messagesPerUser = 10;
      const sockets = [];
      
      // Setup multiple authenticated sockets
      for (let i = 0; i < concurrentUsers; i++) {
        const socket = io(`http://localhost:${httpServer.address().port}`);
        clientSockets.push(socket);
        
        await new Promise((resolve) => {
          socket.on('connect', resolve);
        });
        
        const token = jwt.sign(
          { userId: testUsers[i]._id, username: testUsers[i].username },
          process.env.JWT_SECRET || 'test-secret'
        );
        
        await new Promise((resolve) => {
          socket.emit('authenticate', { token });
          socket.on('authenticated', resolve);
        });
        
        await new Promise((resolve) => {
          socket.emit('join_room', { roomId: testRoom._id });
          socket.on('room_joined', resolve);
        });
        
        sockets.push(socket);
      }
      
      // Send concurrent messages
      const messagePromises = [];
      const startTime = Date.now();
      
      for (let userIndex = 0; userIndex < concurrentUsers; userIndex++) {
        for (let msgIndex = 0; msgIndex < messagesPerUser; msgIndex++) {
          const promise = new Promise((resolve, reject) => {
            const messageStartTime = Date.now();
            const timeout = setTimeout(() => {
              reject(new Error(`Concurrent message timeout: user ${userIndex}, message ${msgIndex}`));
            }, PERFORMANCE_THRESHOLDS.MESSAGE_LATENCY * 2);
            
            sockets[userIndex].emit('send_message', {
              content: `Concurrent message from user ${userIndex}, msg ${msgIndex}`,
              encryptedContent: `encrypted-concurrent-${userIndex}-${msgIndex}`,
              messageType: 'text'
            });
            
            const messageHandler = (data) => {
              if (data.content === `Concurrent message from user ${userIndex}, msg ${msgIndex}`) {
                clearTimeout(timeout);
                const latency = Date.now() - messageStartTime;
                sockets[userIndex].off('new_message', messageHandler);
                resolve({ userIndex, msgIndex, latency });
              }
            };
            
            sockets[userIndex].on('new_message', messageHandler);
          });
          
          messagePromises.push(promise);
        }
      }
      
      // Wait for all messages to complete
      const results = await Promise.all(messagePromises);
      const totalTime = Date.now() - startTime;
      
      // Verify performance
      results.forEach(result => {
        expect(result.latency).toBeLessThan(PERFORMANCE_THRESHOLDS.MESSAGE_LATENCY);
      });
      
      const averageLatency = results.reduce((sum, result) => sum + result.latency, 0) / results.length;
      console.log(`Concurrent test: ${results.length} messages, avg latency: ${averageLatency.toFixed(2)}ms, total time: ${totalTime}ms`);
      
      expect(averageLatency).toBeLessThan(PERFORMANCE_THRESHOLDS.MESSAGE_LATENCY);
    });
  });

  describe('Load Testing', () => {
    test.skip('should handle burst of messages efficiently', async () => {
      const authenticatedSocket = io(`http://localhost:${httpServer.address().port}`);
      clientSockets.push(authenticatedSocket);
      
      await new Promise((resolve) => {
        authenticatedSocket.on('connect', resolve);
      });
      
      const token = jwt.sign(
        { userId: testUsers[0]._id, username: testUsers[0].username },
        process.env.JWT_SECRET || 'test-secret'
      );
      
      await new Promise((resolve) => {
        authenticatedSocket.emit('authenticate', { token });
        authenticatedSocket.on('authenticated', resolve);
      });
      
      await new Promise((resolve) => {
        authenticatedSocket.emit('join_room', { roomId: testRoom._id });
        authenticatedSocket.on('room_joined', resolve);
      });
      
      const burstSize = PERFORMANCE_THRESHOLDS.CONCURRENT_MESSAGES;
      const messagePromises = [];
      const startTime = Date.now();
      
      // Send burst of messages
      for (let i = 0; i < burstSize; i++) {
        const promise = new Promise((resolve, reject) => {
          const messageStartTime = Date.now();
          const timeout = setTimeout(() => {
            reject(new Error(`Burst message ${i} timeout`));
          }, PERFORMANCE_THRESHOLDS.MESSAGE_LATENCY * 3);
          
          authenticatedSocket.emit('send_message', {
            content: `Burst message ${i}`,
            encryptedContent: `encrypted-burst-${i}`,
            messageType: 'text'
          });
          
          const messageHandler = (data) => {
            if (data.content === `Burst message ${i}`) {
              clearTimeout(timeout);
              const latency = Date.now() - messageStartTime;
              authenticatedSocket.off('new_message', messageHandler);
              resolve({ index: i, latency });
            }
          };
          
          authenticatedSocket.on('new_message', messageHandler);
        });
        
        messagePromises.push(promise);
      }
      
      const results = await Promise.all(messagePromises);
      const totalTime = Date.now() - startTime;
      
      // Performance analysis
      const latencies = results.map(r => r.latency);
      const averageLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const minLatency = Math.min(...latencies);
      
      console.log(`Burst test results:
        Messages: ${burstSize}
        Total time: ${totalTime}ms
        Average latency: ${averageLatency.toFixed(2)}ms
        Min latency: ${minLatency}ms
        Max latency: ${maxLatency}ms
        Throughput: ${((burstSize / totalTime) * 1000).toFixed(2)} messages/second`);
      
      // Verify performance requirements
      expect(averageLatency).toBeLessThan(PERFORMANCE_THRESHOLDS.MESSAGE_LATENCY);
      expect(maxLatency).toBeLessThan(PERFORMANCE_THRESHOLDS.MESSAGE_LATENCY * 2); // Allow some tolerance for max
      
      // Throughput should be reasonable
      const throughput = (burstSize / totalTime) * 1000;
      expect(throughput).toBeGreaterThan(10); // At least 10 messages per second
    });
  });

  describe('Memory and Resource Usage', () => {
    test.skip('should not leak memory during extended messaging', async () => {
      const authenticatedSocket = io(`http://localhost:${httpServer.address().port}`);
      clientSockets.push(authenticatedSocket);
      
      await new Promise((resolve) => {
        authenticatedSocket.on('connect', resolve);
      });
      
      const token = jwt.sign(
        { userId: testUsers[0]._id, username: testUsers[0].username },
        process.env.JWT_SECRET || 'test-secret'
      );
      
      await new Promise((resolve) => {
        authenticatedSocket.emit('authenticate', { token });
        authenticatedSocket.on('authenticated', resolve);
      });
      
      await new Promise((resolve) => {
        authenticatedSocket.emit('join_room', { roomId: testRoom._id });
        authenticatedSocket.on('room_joined', resolve);
      });
      
      const initialMemory = process.memoryUsage();
      const messageCount = 100;
      
      // Send many messages to test for memory leaks
      for (let i = 0; i < messageCount; i++) {
        await new Promise((resolve) => {
          authenticatedSocket.emit('send_message', {
            content: `Memory test message ${i}`,
            encryptedContent: `encrypted-memory-${i}`,
            messageType: 'text'
          });
          
          authenticatedSocket.once('new_message', (data) => {
            if (data.content === `Memory test message ${i}`) {
              resolve();
            }
          });
        });
        
        // Periodic garbage collection hint
        if (i % 20 === 0 && global.gc) {
          global.gc();
        }
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePerMessage = memoryIncrease / messageCount;
      
      console.log(`Memory usage:
        Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
        Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
        Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB
        Per message: ${(memoryIncreasePerMessage / 1024).toFixed(2)} KB`);
      
      // Memory increase should be reasonable (less than 1KB per message)
      expect(memoryIncreasePerMessage).toBeLessThan(1024);
    });
  });

  describe('Database Performance', () => {
    test('should maintain message persistence performance', async () => {
      const messageCount = 50;
      const startTime = Date.now();
      
      // Create messages directly in database to test DB performance
      const messagePromises = [];
      
      for (let i = 0; i < messageCount; i++) {
        const promise = Message.create({
          sender: testUsers[i % testUsers.length]._id,
          room: testRoom._id,
          content: `DB performance test message ${i}`,
          encryptedContent: `encrypted-db-${i}`,
          messageType: 'text'
        });
        
        messagePromises.push(promise);
      }
      
      await Promise.all(messagePromises);
      const dbWriteTime = Date.now() - startTime;
      
      // Test database read performance
      const readStartTime = Date.now();
      const messages = await Message.find({ room: testRoom._id })
        .populate('sender', 'username publicKey')
        .sort({ timestamp: -1 })
        .limit(messageCount);
      const dbReadTime = Date.now() - readStartTime;
      
      console.log(`Database performance:
        Write time: ${dbWriteTime}ms (${messageCount} messages)
        Read time: ${dbReadTime}ms (${messageCount} messages)
        Write throughput: ${((messageCount / dbWriteTime) * 1000).toFixed(2)} messages/second
        Read throughput: ${((messageCount / dbReadTime) * 1000).toFixed(2)} messages/second`);
      
      expect(messages).toHaveLength(messageCount);
      expect(dbWriteTime).toBeLessThan(5000); // 5 seconds for 50 messages
      expect(dbReadTime).toBeLessThan(1000); // 1 second for reading 50 messages
      
      // Verify write throughput (at least 10 messages/second)
      const writeThroughput = (messageCount / dbWriteTime) * 1000;
      expect(writeThroughput).toBeGreaterThan(10);
      
      // Verify read throughput (at least 50 messages/second)
      const readThroughput = (messageCount / dbReadTime) * 1000;
      expect(readThroughput).toBeGreaterThan(50);
    });
  });
});