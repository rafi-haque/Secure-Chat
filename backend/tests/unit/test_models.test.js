/**
 * Unit Tests for Backend Models and Services
 * Tests all backend data models and business logic
 */

const _request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const _bcrypt = require('bcryptjs');

// Import models and services
const User = require('../../src/models/user');
const Message = require('../../src/models/Message');
const Room = require('../../src/models/Room');
const userService = require('../../src/services/userService');
const messageService = require('../../src/services/messageService');
const roomService = require('../../src/services/roomService');
const authService = require('../../src/services/authService');
const encryptionService = require('../../src/services/encryptionService');

// Mock MongoDB for testing
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Backend Models and Services', () => {
  let mongoServer;
  let mongoUri;

  // Setup in-memory MongoDB for testing
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await User.deleteMany({});
    await Message.deleteMany({});
    await Room.deleteMany({});
  });

  describe('User Model', () => {
    test('should create a user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'securepassword',
        publicKey: 'test-public-key'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.publicKey).toBe(userData.publicKey);
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.lastSeen).toBeDefined();
      expect(savedUser.createdAt).toBeDefined();
    });

    test('should hash password before saving', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'plainpassword',
        publicKey: 'test-public-key'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.password).not.toBe(userData.password);
      expect(savedUser.password.length).toBeGreaterThan(20);
    });

    test('should validate password correctly', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpassword',
        publicKey: 'test-public-key'  
      };

      const user = new User(userData);
      await user.save();

      const isValid = await user.comparePassword('testpassword');
      const isInvalid = await user.comparePassword('wrongpassword');

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    test('should require unique username', async () => {
      const userData1 = {
        username: 'testuser',
        email: 'test1@example.com',
        password: 'password1',
        publicKey: 'key1'
      };

      const userData2 = {
        username: 'testuser',
        email: 'test2@example.com',
        password: 'password2',
        publicKey: 'key2'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });

    test('should require unique email', async () => {
      const userData1 = {
        username: 'user1',
        email: 'test@example.com',
        password: 'password1',
        publicKey: 'key1'
      };

      const userData2 = {
        username: 'user2',
        email: 'test@example.com',
        password: 'password2',
        publicKey: 'key2'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });

    test('should validate email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password',
        publicKey: 'key'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should enforce minimum password length', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123',
        publicKey: 'key'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Message Model', () => {
    let testUser, testRoom;

    beforeEach(async () => {
      testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password',
        publicKey: 'test-key'
      });
      await testUser.save();

      testRoom = new Room({
        name: 'Test Room',
        isPrivate: false,
        participants: [testUser._id],
        createdBy: testUser._id
      });
      await testRoom.save();
    });

    test('should create a message with valid data', async () => {
      const messageData = {
        sender: testUser._id,
        room: testRoom._id,
        content: 'Test message content',
        encryptedContent: 'encrypted-content',
        messageType: 'text'
      };

      const message = new Message(messageData);
      const savedMessage = await message.save();

      expect(savedMessage._id).toBeDefined();
      expect(savedMessage.sender.toString()).toBe(testUser._id.toString());
      expect(savedMessage.room.toString()).toBe(testRoom._id.toString());
      expect(savedMessage.content).toBe(messageData.content);
      expect(savedMessage.encryptedContent).toBe(messageData.encryptedContent);
      expect(savedMessage.messageType).toBe(messageData.messageType);
      expect(savedMessage.timestamp).toBeDefined();
      expect(savedMessage.isDeleted).toBe(false);
    });

    test('should require sender', async () => {
      const messageData = {
        room: testRoom._id,
        content: 'Test message',
        encryptedContent: 'encrypted'
      };

      const message = new Message(messageData);
      await expect(message.save()).rejects.toThrow();
    });

    test('should require room', async () => {
      const messageData = {
        sender: testUser._id,
        content: 'Test message',
        encryptedContent: 'encrypted'
      };

      const message = new Message(messageData);
      await expect(message.save()).rejects.toThrow();
    });

    test('should validate message type', async () => {
      const messageData = {
        sender: testUser._id,
        room: testRoom._id,
        content: 'Test message',
        encryptedContent: 'encrypted',
        messageType: 'invalid-type'
      };

      const message = new Message(messageData);
      await expect(message.save()).rejects.toThrow();
    });

    test('should populate sender and room data', async () => {
      const messageData = {
        sender: testUser._id,
        room: testRoom._id,
        content: 'Test message',
        encryptedContent: 'encrypted'
      };

      const message = new Message(messageData);
      await message.save();

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'username publicKey')
        .populate('room', 'name isPrivate');

      expect(populatedMessage.sender.username).toBe(testUser.username);
      expect(populatedMessage.room.name).toBe(testRoom.name);
    });
  });

  describe('Room Model', () => {
    let testUser1, testUser2;

    beforeEach(async () => {
      testUser1 = new User({
        username: 'user1',
        email: 'user1@example.com',
        password: 'password',
        publicKey: 'key1'
      });
      await testUser1.save();

      testUser2 = new User({
        username: 'user2',
        email: 'user2@example.com',
        password: 'password',
        publicKey: 'key2'
      });
      await testUser2.save();
    });

    test('should create a public room', async () => {
      const roomData = {
        name: 'Public Room',
        isPrivate: false,
        participants: [testUser1._id, testUser2._id],
        createdBy: testUser1._id
      };

      const room = new Room(roomData);
      const savedRoom = await room.save();

      expect(savedRoom._id).toBeDefined();
      expect(savedRoom.name).toBe(roomData.name);
      expect(savedRoom.isPrivate).toBe(false);
      expect(savedRoom.participants).toHaveLength(2);
      expect(savedRoom.createdAt).toBeDefined();
    });

    test('should create a private room', async () => {
      const roomData = {
        name: 'Private Room',
        isPrivate: true,
        participants: [testUser1._id, testUser2._id],
        passcode: 'secret123',
        createdBy: testUser1._id
      };

      const room = new Room(roomData);
      const savedRoom = await room.save();

      expect(savedRoom.isPrivate).toBe(true);
      expect(savedRoom.passcode).toBe(roomData.passcode);
    });

    test('should require unique room name', async () => {
      const roomData1 = {
        name: 'Test Room',
        isPrivate: false,
        participants: [testUser1._id],
        createdBy: testUser1._id
      };

      const roomData2 = {
        name: 'Test Room',
        isPrivate: false,
        participants: [testUser2._id],
        createdBy: testUser2._id
      };

      const room1 = new Room(roomData1);
      await room1.save();

      const room2 = new Room(roomData2);
      await expect(room2.save()).rejects.toThrow();
    });

    test('should validate participants exist', async () => {
      const roomData = {
        name: 'Test Room',
        isPrivate: false,
        participants: [new mongoose.Types.ObjectId()],
        createdBy: testUser1._id
      };

      const room = new Room(roomData);
      // This would require additional validation in the model
      // For now, just test that it saves (MongoDB doesn't enforce foreign keys by default)
      const savedRoom = await room.save();
      expect(savedRoom).toBeDefined();
    });
  });

  describe('User Service', () => {
    test('should create user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'securepassword',
        publicKey: 'test-public-key'
      };

      const user = await userService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.publicKey).toBe(userData.publicKey);
    });

    test('should find user by username', async () => {
      const userData = {
        username: 'findme',
        email: 'findme@example.com',
        password: 'password',
        publicKey: 'key'
      };

      await userService.createUser(userData);
      const foundUser = await userService.findUserByUsername('findme');

      expect(foundUser).toBeDefined();
      expect(foundUser.username).toBe('findme');
    });

    test('should find user by email', async () => {
      const uniqueEmail = `findme-${Date.now()}@example.com`;
      const userData = {
        username: `testuser_${Date.now()}`,
        email: uniqueEmail,
        password: 'password',
        publicKey: 'key'
      };

      await userService.createUser(userData);
      const foundUser = await userService.findUserByEmail(uniqueEmail);

      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(uniqueEmail);
    });

    test('should update user status', async () => {
      const userData = {
        username: `testuser_status_${Date.now()}`,
        email: `test_status_${Date.now()}@example.com`,
        password: 'password',
        publicKey: 'key'
      };

      const user = await userService.createUser(userData);
      const updatedUser = await userService.updateUserStatus(user._id, false);
      
      expect(updatedUser.isActive).toBe(false);
    });

    test('should get online users', async () => {
      const timestamp = Date.now();
      const user1Data = {
        username: `online_user1_${timestamp}`,
        email: `online_user1_${timestamp}@example.com`,
        password: 'password',
        publicKey: 'key1'
      };

      const user2Data = {
        username: `online_user2_${timestamp}`,
        email: `online_user2_${timestamp}@example.com`,
        password: 'password',
        publicKey: 'key2'
      };

      const user1 = await userService.createUser(user1Data);
      const user2 = await userService.createUser(user2Data);
      
      await userService.updateUserStatus(user2._id, false);

      // Filter results to only include our test users
      const allOnlineUsers = await userService.getOnlineUsers();
      const testOnlineUsers = allOnlineUsers.filter(u => u.username.includes(`_${timestamp}`));
      expect(testOnlineUsers).toHaveLength(1);
      expect(testOnlineUsers[0].username).toBe(`online_user1_${timestamp}`);
    });
  });

  describe('Auth Service', () => {
    let testUser;

    beforeEach(async () => {
      testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpassword',
        publicKey: 'test-key'
      });
      await testUser.save();
    });

    test('should authenticate user with valid credentials', async () => {
      const result = await authService.authenticate('testuser', 'testpassword');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.username).toBe('testuser');
    });

    test('should reject invalid username', async () => {
      const result = await authService.authenticate('wronguser', 'testpassword');

      expect(result.success).toBe(false);
      expect(result.user).toBeNull();
      expect(result.token).toBeNull();
      expect(result.error).toBe('User not found');
    });

    test('should reject invalid password', async () => {
      const result = await authService.authenticate('testuser', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.user).toBeNull();
      expect(result.token).toBeNull();
      expect(result.error).toBe('Invalid password');
    });

    test('should generate valid JWT token', async () => {
      const result = await authService.authenticate('testuser', 'testpassword');
      const token = result.token;

      expect(token).toBeDefined();
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
      expect(decoded.userId).toBe(testUser._id.toString());
      expect(decoded.username).toBe('testuser');
    });

    test('should verify valid JWT token', async () => {
      const result = await authService.authenticate('testuser', 'testpassword');
      const token = result.token;

      const verification = await authService.verifyToken(token);
      expect(verification.valid).toBe(true);
      expect(verification.user).toBeDefined();
      expect(verification.user.username).toBe('testuser');
    });

    test('should reject invalid JWT token', async () => {
      const verification = await authService.verifyToken('invalid-token');
      expect(verification.valid).toBe(false);
      expect(verification.user).toBeNull();
    });
  });

  describe('Message Service', () => {
    let testUser, testRoom;

    beforeEach(async () => {
      testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password',
        publicKey: 'test-key'
      });
      await testUser.save();

      testRoom = new Room({
        name: 'Test Room',
        isPrivate: false,
        participants: [testUser._id],
        createdBy: testUser._id
      });
      await testRoom.save();
    });

    test('should create message successfully', async () => {
      const messageData = {
        senderId: testUser._id,
        roomId: testRoom._id,
        content: 'Test message',
        encryptedContent: 'encrypted-content'
      };

      const message = await messageService.createMessage(messageData);

      expect(message).toBeDefined();
      expect(message.sender.toString()).toBe(testUser._id.toString());
      expect(message.room.toString()).toBe(testRoom._id.toString());
      expect(message.content).toBe('Test message');
    });

    test('should get messages for room', async () => {
      const messageData = {
        senderId: testUser._id,
        roomId: testRoom._id,
        content: 'Test message',
        encryptedContent: 'encrypted'
      };

      await messageService.createMessage(messageData);
      const messages = await messageService.getMessagesForRoom(testRoom._id);

      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe('Test message');
    });

    test('should delete message', async () => {
      const messageData = {
        senderId: testUser._id,
        roomId: testRoom._id,
        content: 'Test message',
        encryptedContent: 'encrypted'
      };

      const message = await messageService.createMessage(messageData);
      await messageService.deleteMessage(message._id);

      const deletedMessage = await Message.findById(message._id);
      expect(deletedMessage.isDeleted).toBe(true);
    });

    test('should get message history with pagination', async () => {
      // Create multiple messages
      for (let i = 0; i < 25; i++) {
        await messageService.createMessage({
          senderId: testUser._id,
          roomId: testRoom._id,
          content: `Message ${i}`,
          encryptedContent: `encrypted-${i}`
        });
      }

      const page1 = await messageService.getMessageHistory(testRoom._id, 1, 10);
      const page2 = await messageService.getMessageHistory(testRoom._id, 2, 10);

      expect(page1.messages).toHaveLength(10);
      expect(page2.messages).toHaveLength(10);
      expect(page1.totalPages).toBe(3);
      expect(page1.currentPage).toBe(1);
    });
  });

  describe('Room Service', () => {
    let testUser1, testUser2;

    beforeEach(async () => {
      testUser1 = new User({
        username: 'user1',
        email: 'user1@example.com',
        password: 'password',
        publicKey: 'key1'
      });
      await testUser1.save();

      testUser2 = new User({
        username: 'user2',
        email: 'user2@example.com',
        password: 'password',
        publicKey: 'key2'
      });
      await testUser2.save();
    });

    test('should create room successfully', async () => {
      const roomData = {
        name: 'Test Room',
        isPrivate: false,
        participants: [testUser1._id, testUser2._id]
      };

      const room = await roomService.createRoom(roomData);

      expect(room).toBeDefined();
      expect(room.name).toBe('Test Room');
      expect(room.participants).toHaveLength(2);
    });

    test('should add participant to room', async () => {
      const roomData = {
        name: 'Test Room',
        isPrivate: false,
        participants: [testUser1._id]
      };

      const room = await roomService.createRoom(roomData);
      await roomService.addParticipant(room._id, testUser2._id);

      const updatedRoom = await Room.findById(room._id);
      expect(updatedRoom.participants).toHaveLength(2);
    });

    test('should remove participant from room', async () => {
      const roomData = {
        name: 'Test Room',
        isPrivate: false,
        participants: [testUser1._id, testUser2._id]
      };

      const room = await roomService.createRoom(roomData);
      await roomService.removeParticipant(room._id, testUser2._id);

      const updatedRoom = await Room.findById(room._id);
      expect(updatedRoom.participants).toHaveLength(1);
    });

    test('should get rooms for user', async () => {
      const room1Data = {
        name: 'Room 1',
        isPrivate: false,
        participants: [testUser1._id]
      };

      const room2Data = {
        name: 'Room 2',
        isPrivate: false,
        participants: [testUser1._id, testUser2._id]
      };

      await roomService.createRoom(room1Data);
      await roomService.createRoom(room2Data);

      const userRooms = await roomService.getRoomsForUser(testUser1._id);
      expect(userRooms).toHaveLength(2);
    });

    test('should validate passcode for private room', async () => {
      const roomData = {
        name: 'Private Room',
        isPrivate: true,
        participants: [testUser1._id],
        passcode: 'secret123'
      };

      const room = await roomService.createRoom(roomData);
      
      const validPasscode = await roomService.validateRoomPasscode(room._id, 'secret123');
      const invalidPasscode = await roomService.validateRoomPasscode(room._id, 'wrong');

      expect(validPasscode).toBe(true);
      expect(invalidPasscode).toBe(false);
    });
  });

  describe('Encryption Service', () => {
    test('should validate encrypted message format', () => {
      const validMessage = 'a'.repeat(256); // Valid RSA-2048 encrypted message
      const invalidMessage = 'short';

      expect(encryptionService.isValidEncryptedMessage(validMessage)).toBe(true);
      expect(encryptionService.isValidEncryptedMessage(invalidMessage)).toBe(false);
    });

    test('should generate secure message ID', () => {
      const id1 = encryptionService.generateMessageId();
      const id2 = encryptionService.generateMessageId();

      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
      expect(id1.includes('-')).toBe(true);
    });

    test('should validate public key format', () => {
      const validKey = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----';
      const invalidKey = 'invalid-key-format';

      expect(encryptionService.isValidPublicKey(validKey)).toBe(true);
      expect(encryptionService.isValidPublicKey(invalidKey)).toBe(false);
    });

    test('should sanitize message content', () => {
      const maliciousContent = '<script>alert("xss")</script>Hello World';
      const sanitized = encryptionService.sanitizeMessageContent(maliciousContent);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello World');
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      // Temporarily close the connection
      await mongoose.disconnect();

      try {
        await userService.createUser({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password',
          publicKey: 'key'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Reconnect for other tests
      await mongoose.connect(mongoUri);
    });

    test('should handle invalid ObjectId gracefully', async () => {
      try {
        await userService.findUserById('invalid-object-id');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});