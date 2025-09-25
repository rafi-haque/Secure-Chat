const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Public Key Lookup API Contract Tests', () => {
  let app;
  let mongoServer;

  beforeAll(async () => {
    // Setup in-memory MongoDB for testing
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = mongoUri;
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

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

  describe('GET /api/users/:username/publickey', () => {
    it('should return public key for existing user', async () => {
      // First register a user (this test assumes registration works)
      const userData = {
        username: 'lookupuser',
        publicKey: 'test-public-key-for-lookup'
      };

      await request(app)
        .post('/api/register')
        .send(userData)
        .expect(201);

      // Now lookup the public key
      const response = await request(app)
        .get('/api/users/lookupuser/publickey')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('username', 'lookupuser');
      expect(response.body).toHaveProperty('publicKey', 'test-public-key-for-lookup');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/nonexistentuser/publickey')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should handle username case sensitivity correctly', async () => {
      // Register user with specific case
      const userData = {
        username: 'CaseUser',
        publicKey: 'case-test-public-key'
      };

      await request(app)
        .post('/api/register')
        .send(userData)
        .expect(201);

      // Lookup should be case sensitive - different case should fail
      const response = await request(app)
        .get('/api/users/caseuser/publickey')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('GET /api/users/search/:query', () => {
    it('should return matching usernames for search query', async () => {
      // Register multiple users for search testing
      const users = [
        { username: 'alice', publicKey: 'alice-key' },
        { username: 'alicesmith', publicKey: 'alicesmith-key' },
        { username: 'bob', publicKey: 'bob-key' }
      ];

      for (const user of users) {
        await request(app)
          .post('/api/register')
          .send(user)
          .expect(201);
      }

      const response = await request(app)
        .get('/api/users/search/alice')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users).toHaveLength(2);
      expect(response.body.users.map(u => u.username)).toContain('alice');
      expect(response.body.users.map(u => u.username)).toContain('alicesmith');
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app)
        .get('/api/users/search/nonexistent')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('users', []);
    });
  });
});