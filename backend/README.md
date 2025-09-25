# Secure Chat Backend

A Node.js backend server providing secure messaging APIs with real-time communication and end-to-end encryption support.

## 🏗️ Architecture

```
backend/
├── src/
│   ├── controllers/    # Request handlers
│   │   ├── authController.js    # Authentication logic
│   │   ├── messageController.js # Message handling
│   │   └── userController.js    # User management
│   ├── models/         # Database models
│   │   ├── User.js     # User schema and methods
│   │   ├── Message.js  # Message schema
│   │   └── Conversation.js # Conversation schema
│   ├── middleware/     # Express middleware
│   │   ├── auth.js     # Authentication middleware
│   │   ├── validation.js # Request validation
│   │   └── rateLimiting.js # Rate limiting
│   ├── routes/         # API routes
│   │   ├── auth.js     # Authentication routes
│   │   ├── messages.js # Message routes
│   │   └── users.js    # User routes
│   ├── services/       # Business logic
│   │   ├── authService.js # Authentication services
│   │   ├── messageService.js # Message services
│   │   └── cryptoService.js # Crypto utilities
│   ├── utils/          # Utility functions
│   │   ├── logger.js   # Logging configuration
│   │   ├── database.js # Database connection
│   │   └── helpers.js  # General utilities
│   └── websocket/      # WebSocket handling
│       ├── socketHandlers.js # Socket event handlers
│       └── socketAuth.js     # Socket authentication
├── tests/              # Test suites
├── config/             # Configuration files
└── logs/               # Application logs
```

## 🚦 Server Configuration

### Port Configuration
- **HTTP Server**: Port 5000 - RESTful API endpoints
- **WebSocket Server**: Port 3001 - Real-time messaging
- **Health Check**: `GET /health` - Server status endpoint

### Environment Setup
Create `.env` file in backend root:
```env
# Server Configuration
PORT=5000
WEBSOCKET_PORT=3001
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/secure-chat
DB_NAME=secure-chat

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## 🔐 API Endpoints

### Authentication Routes (`/api/auth/`)

#### POST `/api/register`
Register a new user account.

**Request Body:**
```json
{
  "username": "string (3-30 chars, required)",
  "email": "string (valid email, required)",
  "password": "string (8+ chars, required)",
  "publicKey": "string (RSA public key, required)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "userId",
    "username": "username",
    "email": "email@example.com",
    "publicKey": "-----BEGIN PUBLIC KEY-----..."
  },
  "token": "jwt-token-here"
}
```

#### POST `/api/login`
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "userId",
    "username": "username",
    "publicKey": "-----BEGIN PUBLIC KEY-----..."
  },
  "token": "jwt-token-here"
}
```

#### POST `/api/logout`
Invalidate user session (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Message Routes (`/api/messages/`)

#### GET `/api/messages/:conversationId`
Retrieve message history for a conversation.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `limit`: number (default: 50, max: 100)
- `offset`: number (default: 0)
- `before`: ISO date string (pagination)

**Response (200):**
```json
{
  "success": true,
  "messages": [
    {
      "id": "messageId",
      "conversationId": "conversationId",
      "senderId": "userId",
      "recipientId": "userId",
      "content": "encrypted-message-content",
      "encryptedKey": "encrypted-aes-key",
      "iv": "initialization-vector",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "messageType": "text|file|system",
      "deliveredAt": "2024-01-01T00:00:01.000Z",
      "readAt": null
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### POST `/api/messages`
Send a new encrypted message.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "recipientId": "string (required)",
  "content": "string (encrypted message, required)",
  "encryptedKey": "string (encrypted AES key, required)",
  "iv": "string (initialization vector, required)",
  "messageType": "text|file (default: text)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "messageId": "generated-message-id",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### User Routes (`/api/users/`)

#### GET `/api/users`
Get list of users for contact discovery.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `search`: string (username search)
- `limit`: number (default: 20)

**Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "id": "userId",
      "username": "username",
      "publicKey": "-----BEGIN PUBLIC KEY-----...",
      "isOnline": true,
      "lastSeen": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET `/api/users/:userId/key`
Get a specific user's public key.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "userId": "userId",
  "publicKey": "-----BEGIN PUBLIC KEY-----...",
  "keyFingerprint": "sha256-hash-of-key"
}
```

## 🔌 WebSocket Events

### Connection
```javascript
// Client connection with authentication
socket.emit('authenticate', { token: 'jwt-token' });

// Server response
socket.emit('authenticated', { userId: 'user-id' });
// or
socket.emit('authentication_error', { message: 'Invalid token' });
```

### Real-time Messaging

#### Send Message
```javascript
// Client sends message
socket.emit('send_message', {
  recipientId: 'user-id',
  content: 'encrypted-content',
  encryptedKey: 'encrypted-aes-key',
  iv: 'initialization-vector',
  messageType: 'text'
});

// Server confirms
socket.emit('message_sent', {
  messageId: 'generated-id',
  timestamp: '2024-01-01T00:00:00.000Z'
});
```

#### Receive Message
```javascript
// Server sends to recipient
socket.emit('new_message', {
  messageId: 'message-id',
  senderId: 'sender-id',
  content: 'encrypted-content',
  encryptedKey: 'encrypted-aes-key',
  iv: 'initialization-vector',
  timestamp: '2024-01-01T00:00:00.000Z',
  messageType: 'text'
});
```

#### Typing Indicators
```javascript
// Client starts typing
socket.emit('typing_start', { conversationId: 'conv-id' });

// Client stops typing
socket.emit('typing_stop', { conversationId: 'conv-id' });

// Server broadcasts to conversation participants
socket.emit('user_typing', {
  userId: 'user-id',
  conversationId: 'conv-id',
  isTyping: true
});
```

#### Presence Events
```javascript
// User comes online
socket.emit('user_online', { userId: 'user-id' });

// User goes offline
socket.emit('user_offline', {
  userId: 'user-id',
  lastSeen: '2024-01-01T00:00:00.000Z'
});
```

## 🗄️ Database Models

### User Model
```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  email: String (unique, required),
  passwordHash: String (required),
  publicKey: String (required),
  keyFingerprint: String (indexed),
  isActive: Boolean (default: true),
  isOnline: Boolean (default: false),
  lastSeen: Date,
  createdAt: Date,
  updatedAt: Date,
  profile: {
    displayName: String,
    avatar: String,
    status: String
  },
  security: {
    failedLoginAttempts: Number (default: 0),
    lockoutUntil: Date,
    lastPasswordChange: Date,
    twoFactorEnabled: Boolean (default: false)
  }
}
```

### Message Model
```javascript
{
  _id: ObjectId,
  conversationId: String (indexed, required),
  senderId: ObjectId (ref: 'User', required),
  recipientId: ObjectId (ref: 'User', required),
  content: String (encrypted, required),
  encryptedKey: String (required),
  iv: String (required),
  messageType: String (enum: ['text', 'file', 'system']),
  timestamp: Date (required),
  deliveredAt: Date,
  readAt: Date,
  editedAt: Date,
  isDeleted: Boolean (default: false),
  metadata: {
    fileSize: Number,
    fileName: String,
    mimeType: String,
    checksum: String
  }
}
```

### Conversation Model
```javascript
{
  _id: ObjectId,
  participants: [ObjectId] (ref: 'User', required),
  type: String (enum: ['direct', 'group']),
  isActive: Boolean (default: true),
  lastMessage: {
    content: String,
    timestamp: Date,
    senderId: ObjectId
  },
  createdAt: Date,
  updatedAt: Date,
  settings: {
    isEncrypted: Boolean (default: true),
    retentionDays: Number,
    allowFileSharing: Boolean (default: true)
  }
}
```

## 🛡️ Security Implementation

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Password Security**: bcrypt with configurable rounds
- **Rate Limiting**: Configurable request limits per IP
- **Input Validation**: Comprehensive request validation
- **CORS Configuration**: Restricted origin access

### Middleware Stack
```javascript
// Security middleware order
app.use(helmet());              // Security headers
app.use(cors(corsOptions));     // CORS configuration
app.use(rateLimiter);          // Rate limiting
app.use(express.json());       // JSON parsing
app.use(requestLogger);        // Request logging
app.use(authMiddleware);       // Authentication (protected routes)
app.use(validationMiddleware); // Input validation
```

### Encryption Support
- **Key Storage**: Public keys stored in database
- **Message Encryption**: Client-side encryption verified
- **Transport Security**: HTTPS/WSS in production
- **Data Validation**: Encrypted message format validation

## 🧪 Testing

### Test Structure
```
tests/
├── unit/
│   ├── controllers/    # Controller unit tests
│   ├── models/         # Model unit tests
│   ├── services/       # Service unit tests
│   └── middleware/     # Middleware unit tests
├── integration/
│   ├── api/           # API endpoint tests
│   ├── websocket/     # WebSocket tests
│   └── database/      # Database integration tests
├── fixtures/          # Test data and mocks
└── helpers/           # Test utilities
```

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- --grep "Authentication"

# Run integration tests
npm run test:integration

# Run unit tests only
npm run test:unit
```

### Test Configuration
```javascript
// Jest configuration (jest.config.js)
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**'
  ]
};
```

## 🚀 Development

### Prerequisites
- Node.js 18+ and npm
- MongoDB 5.0+
- Git

### Quick Start
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Or start with nodemon
npm run dev:watch
```

### Development Scripts
```bash
npm run dev          # Start development server
npm run dev:watch    # Start with auto-reload
npm run start        # Start production server
npm run test         # Run test suite
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix linting issues
npm run docs         # Generate API documentation
```

### Database Setup
```bash
# Start MongoDB (macOS with Homebrew)
brew services start mongodb-community

# Start MongoDB (Linux)
sudo systemctl start mongod

# Create database and indexes
npm run db:setup

# Seed test data (optional)
npm run db:seed
```

## 📊 Monitoring & Logging

### Logging Configuration
```javascript
// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});
```

### Health Monitoring
```javascript
// Health check endpoint
GET /health
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "services": {
    "database": "connected",
    "websocket": "running"
  },
  "memory": {
    "used": "45.2 MB",
    "total": "512 MB"
  }
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Required
PORT=5000
WEBSOCKET_PORT=3001
MONGODB_URI=mongodb://localhost:27017/secure-chat
JWT_SECRET=your-secret-key

# Optional with defaults
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=24h
```

### Database Configuration
```javascript
// MongoDB connection options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: false
};
```

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check MongoDB status
systemctl status mongod

# Check connection string
echo $MONGODB_URI

# Test connection
mongo $MONGODB_URI --eval "db.stats()"
```

**JWT Token Issues**
```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET

# Check token expiration
node -e "console.log(require('jsonwebtoken').decode('your-token'))"
```

**WebSocket Connection Problems**
```bash
# Check if port is in use
lsof -i :3001

# Test WebSocket connection
wscat -c ws://localhost:3001
```

**High Memory Usage**
```javascript
// Monitor memory usage
setInterval(() => {
  const used = process.memoryUsage();
  console.log('Memory usage:', {
    rss: Math.round(used.rss / 1024 / 1024) + 'MB',
    heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
    heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB'
  });
}, 30000);
```

### Debug Mode
Enable debug logging:
```bash
DEBUG=secure-chat:* npm run dev
```

## 🚀 Production Deployment

### Production Configuration
```bash
# Production environment variables
NODE_ENV=production
PORT=80
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/secure-chat
JWT_SECRET=super-secure-production-secret
LOG_LEVEL=warn
CORS_ORIGIN=https://yourdomain.com
```

### PM2 Process Manager
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit

# View logs
pm2 logs secure-chat-api
```

### Security Hardening
- Use HTTPS/WSS certificates
- Set secure headers with Helmet.js
- Enable MongoDB authentication
- Use environment-specific secrets
- Implement IP whitelisting
- Set up log monitoring
- Enable database backups

## 📈 Performance Optimization

### Database Optimization
```javascript
// Recommended indexes
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.messages.createIndex({ conversationId: 1, timestamp: -1 });
db.messages.createIndex({ recipientId: 1, timestamp: -1 });
```

### Caching Strategy
- Redis for session storage
- In-memory caching for frequently accessed data
- Database query result caching
- Static asset caching

### Monitoring Metrics
- Response time per endpoint
- WebSocket connection count
- Database query performance
- Memory and CPU usage
- Error rates and types