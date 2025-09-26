const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('User Registration API Contract Tests', () => {
  let app;
  let mongoServer;

  beforeAll(async () => {
    // Setup in-memory MongoDB for testing
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = mongoUri;
    
    await mongoose.connect(mongoUri);

    // Import app after database is connected
    const serverModule = require('../../src/server');
    app = serverModule.app || serverModule;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await mongoose.connection.db.dropDatabase();
  });

  describe('POST /api/register', () => {
    it('should register a new user with username and public key', async () => {
      const userData = {
        username: 'testuser',
        publicKey: 'fake-public-key-for-testing'
      };

      const response = await request(app)
        .post('/api/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('username', userData.username);
      expect(response.body).not.toHaveProperty('publicKey'); // Should not echo back public key
    });

    it('should reject registration with duplicate username', async () => {
      const userData = {
        username: 'duplicateuser',
        publicKey: 'fake-public-key-1'
      };

      // First registration should succeed
      await request(app)
        .post('/api/register')
        .send(userData)
        .expect(201);

      // Second registration with same username should fail
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'duplicateuser',
          publicKey: 'fake-public-key-2'
        })
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Username already exists');
    });

    it('should reject registration without username', async () => {
      const userData = {
        publicKey: 'fake-public-key'
      };

      const response = await request(app)
        .post('/api/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Username is required');
    });

    it('should reject registration without public key', async () => {
      const userData = {
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Public key is required');
    });
  });
});