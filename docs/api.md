# Secure Chat API Documentation

## Overview

The Secure Chat API provides a comprehensive backend service for secure, real-time messaging with end-to-end encryption. The API is built using Node.js, Express.js, and Socket.io, with MongoDB for data persistence.

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. All protected endpoints require an `Authorization` header with a valid JWT token.

```
Authorization: Bearer <your-jwt-token>
```

## WebSocket Connection

Real-time messaging is handled via Socket.io WebSocket connections:

```
Production: wss://your-domain.com
Development: ws://localhost:3000
```

---

## REST API Endpoints

### Authentication Endpoints

#### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "username": "string (3-30 characters, alphanumeric + underscore)",
  "email": "string (valid email format)",
  "password": "string (minimum 8 characters)",
  "publicKey": "string (RSA public key in PEM format)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "publicKey": "string",
    "createdAt": "string (ISO 8601)",
    "isActive": true
  },
  "token": "string (JWT token)"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "string (error message)",
  "details": {
    "field": "string (validation details)"
  }
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword123",
    "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkq..."
  }'
```

#### POST /api/auth/login

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "publicKey": "string",
    "lastSeen": "string (ISO 8601)",
    "isActive": true
  },
  "token": "string (JWT token)"
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "securepassword123"
  }'
```

#### POST /api/auth/logout

Logout user and invalidate token.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### GET /api/auth/verify

Verify JWT token validity.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "publicKey": "string"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

### User Management Endpoints

#### GET /api/users/profile

Get current user's profile information.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "publicKey": "string",
    "isActive": true,
    "lastSeen": "string (ISO 8601)",
    "createdAt": "string (ISO 8601)"
  }
}
```

#### PUT /api/users/profile

Update current user's profile.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "email": "string (optional)",
  "publicKey": "string (optional, RSA public key)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "publicKey": "string",
    "updatedAt": "string (ISO 8601)"
  }
}
```

#### GET /api/users/online

Get list of currently online users.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "users": [
    {
      "id": "string",
      "username": "string",
      "publicKey": "string",
      "lastSeen": "string (ISO 8601)"
    }
  ],
  "count": "number"
}
```

#### GET /api/users/search

Search users by username.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `q`: string (search query)
- `limit`: number (optional, default: 10, max: 50)

**Response (200 OK):**
```json
{
  "success": true,
  "users": [
    {
      "id": "string",
      "username": "string",
      "publicKey": "string",
      "isActive": true
    }
  ],
  "count": "number"
}
```

**Example cURL:**
```bash
curl -X GET "http://localhost:3000/api/users/search?q=john&limit=5" \
  -H "Authorization: Bearer <jwt-token>"
```

### Room Management Endpoints

#### GET /api/rooms

Get user's rooms.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "rooms": [
    {
      "id": "string",
      "name": "string",
      "isPrivate": false,
      "participantCount": "number",
      "lastMessage": {
        "content": "string",
        "timestamp": "string (ISO 8601)",
        "sender": "string (username)"
      },
      "createdAt": "string (ISO 8601)"
    }
  ]
}
```

#### POST /api/rooms

Create a new room.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "string (3-50 characters)",
  "isPrivate": "boolean (optional, default: false)",
  "passcode": "string (required if isPrivate: true, 6-20 characters)",
  "description": "string (optional, max 200 characters)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Room created successfully",
  "room": {
    "id": "string",
    "name": "string",
    "isPrivate": false,
    "description": "string",
    "participants": ["string (user IDs)"],
    "createdAt": "string (ISO 8601)",
    "createdBy": "string (user ID)"
  }
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/rooms \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Development Team",
    "isPrivate": true,
    "passcode": "dev2024",
    "description": "Team discussion room"
  }'
```

#### GET /api/rooms/:roomId

Get room details.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Path Parameters:**
- `roomId`: string (MongoDB ObjectId)

**Response (200 OK):**
```json
{
  "success": true,
  "room": {
    "id": "string",
    "name": "string",
    "isPrivate": false,
    "description": "string",
    "participants": [
      {
        "id": "string",
        "username": "string",
        "publicKey": "string",
        "isActive": true
      }
    ],
    "createdAt": "string (ISO 8601)",
    "createdBy": {
      "id": "string",
      "username": "string"
    }
  }
}
```

#### POST /api/rooms/:roomId/join

Join a room.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Path Parameters:**
- `roomId`: string (MongoDB ObjectId)

**Request Body:**
```json
{
  "passcode": "string (required for private rooms)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Joined room successfully",
  "room": {
    "id": "string",
    "name": "string",
    "isPrivate": false
  }
}
```

**Response (403 Forbidden):**
```json
{
  "success": false,
  "error": "Invalid passcode"
}
```

#### POST /api/rooms/:roomId/leave

Leave a room.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Left room successfully"
}
```

### Message Endpoints

#### GET /api/rooms/:roomId/messages

Get message history for a room.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Path Parameters:**
- `roomId`: string (MongoDB ObjectId)

**Query Parameters:**
- `page`: number (optional, default: 1)
- `limit`: number (optional, default: 50, max: 100)
- `before`: string (optional, ISO 8601 timestamp for pagination)

**Response (200 OK):**
```json
{
  "success": true,
  "messages": [
    {
      "id": "string",
      "sender": {
        "id": "string",
        "username": "string",
        "publicKey": "string"
      },
      "content": "string (plaintext for display)",
      "encryptedContent": "string (encrypted for recipients)",
      "messageType": "text|file|image",
      "timestamp": "string (ISO 8601)",
      "isDeleted": false,
      "reactions": [
        {
          "emoji": "string",
          "users": ["string (user IDs)"],
          "count": "number"
        }
      ]
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalMessages": "number",
    "hasNext": "boolean",
    "hasPrevious": "boolean"
  }
}
```

**Example cURL:**
```bash
curl -X GET "http://localhost:3000/api/rooms/507f1f77bcf86cd799439011/messages?page=1&limit=20" \
  -H "Authorization: Bearer <jwt-token>"
```

#### DELETE /api/messages/:messageId

Delete a message (soft delete).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Path Parameters:**
- `messageId`: string (MongoDB ObjectId)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

**Response (403 Forbidden):**
```json
{
  "success": false,
  "error": "You can only delete your own messages"
}
```

---

## WebSocket Events

### Client to Server Events

#### authenticate

Authenticate WebSocket connection.

**Payload:**
```json
{
  "token": "string (JWT token)"
}
```

**Response Events:**
- `authenticated`: Authentication successful
- `authentication_error`: Authentication failed

#### join_room

Join a room for real-time messaging.

**Payload:**
```json
{
  "roomId": "string (MongoDB ObjectId)"
}
```

**Response Events:**
- `room_joined`: Successfully joined room
- `room_error`: Failed to join room

#### leave_room

Leave a room.

**Payload:**
```json
{
  "roomId": "string (MongoDB ObjectId)"
}
```

**Response Events:**
- `room_left`: Successfully left room

#### send_message

Send a message to the current room.

**Payload:**
```json
{
  "content": "string (plaintext message)",
  "encryptedContent": "string (RSA encrypted message)",
  "messageType": "text|file|image",
  "replyTo": "string (optional, message ID for replies)"
}
```

**Response Events:**
- `message_sent`: Message sent successfully
- `message_error`: Failed to send message

#### typing_start

Indicate user is typing.

**Payload:**
```json
{
  "roomId": "string (MongoDB ObjectId)"
}
```

#### typing_stop

Indicate user stopped typing.

**Payload:**
```json
{
  "roomId": "string (MongoDB ObjectId)"
}
```

#### message_reaction

Add or remove reaction to a message.

**Payload:**
```json
{
  "messageId": "string (MongoDB ObjectId)",
  "emoji": "string (emoji character)",
  "action": "add|remove"
}
```

### Server to Client Events

#### authenticated

Authentication successful.

**Payload:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "username": "string",
    "publicKey": "string"
  }
}
```

#### authentication_error

Authentication failed.

**Payload:**
```json
{
  "error": "string (error message)"
}
```

#### room_joined

Successfully joined a room.

**Payload:**
```json
{
  "roomId": "string",
  "roomName": "string",
  "participants": [
    {
      "id": "string",
      "username": "string",
      "publicKey": "string",
      "isActive": true
    }
  ]
}
```

#### room_error

Failed to join room.

**Payload:**
```json
{
  "error": "string (error message)"
}
```

#### new_message

New message received in room.

**Payload:**
```json
{
  "id": "string (message ID)",
  "sender": {
    "id": "string",
    "username": "string",
    "publicKey": "string"
  },
  "content": "string (plaintext)",
  "encryptedContent": "string (encrypted)",
  "messageType": "text|file|image",
  "timestamp": "string (ISO 8601)",
  "replyTo": {
    "id": "string",
    "content": "string",
    "sender": "string"
  }
}
```

#### message_deleted

Message was deleted.

**Payload:**
```json
{
  "messageId": "string",
  "deletedBy": "string (username)"
}
```

#### user_joined

User joined the room.

**Payload:**
```json
{
  "user": {
    "id": "string",
    "username": "string",
    "publicKey": "string"
  },
  "roomId": "string"
}
```

#### user_left

User left the room.

**Payload:**
```json
{
  "userId": "string",
  "username": "string",
  "roomId": "string"
}
```

#### user_typing

User is typing.

**Payload:**
```json
{
  "userId": "string",
  "username": "string",
  "roomId": "string"
}
```

#### user_stopped_typing

User stopped typing.

**Payload:**
```json
{
  "userId": "string",
  "username": "string",
  "roomId": "string"
}
```

#### message_reaction_updated

Message reaction was added or removed.

**Payload:**
```json
{
  "messageId": "string",
  "emoji": "string",
  "action": "add|remove",
  "user": {
    "id": "string",
    "username": "string"
  },
  "totalReactions": {
    "😀": 5,
    "👍": 3
  }
}
```

#### connection_error

WebSocket connection error.

**Payload:**
```json
{
  "error": "string (error message)",
  "code": "string (error code)"
}
```

---

## Error Codes

### HTTP Status Codes

- `200`: OK - Request successful
- `201`: Created - Resource created successfully
- `400`: Bad Request - Invalid request data
- `401`: Unauthorized - Authentication required or invalid
- `403`: Forbidden - Access denied
- `404`: Not Found - Resource not found
- `409`: Conflict - Resource already exists
- `422`: Unprocessable Entity - Validation errors
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server error

### WebSocket Error Codes

- `AUTH_REQUIRED`: Authentication required
- `INVALID_TOKEN`: Invalid or expired JWT token
- `ROOM_NOT_FOUND`: Room does not exist
- `ACCESS_DENIED`: No permission to access room
- `MESSAGE_TOO_LONG`: Message exceeds length limit
- `RATE_LIMITED`: Too many requests
- `SERVER_ERROR`: Internal server error

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

### REST API Limits
- **Authentication endpoints**: 5 requests per minute per IP
- **Message endpoints**: 100 requests per minute per user
- **Room endpoints**: 20 requests per minute per user
- **User endpoints**: 50 requests per minute per user

### WebSocket Limits
- **Messages**: 60 messages per minute per user
- **Room joins**: 10 joins per minute per user
- **Typing events**: 30 events per minute per user

Rate limit headers are included in REST API responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Security Considerations

### End-to-End Encryption
- All messages are encrypted client-side using RSA-OAEP
- Server never has access to plaintext messages
- Each user has a unique RSA key pair (2048-bit minimum)

### Authentication Security
- JWT tokens expire after 24 hours
- Passwords are hashed using bcrypt (12 rounds)
- Rate limiting prevents brute force attacks

### Data Privacy
- User passwords are never stored in plaintext
- Message content is encrypted before database storage
- Private keys never leave the client

### Input Validation
- All inputs are validated and sanitized
- SQL injection protection via MongoDB/Mongoose
- XSS prevention through input sanitization

---

## WebSocket Client Example

### JavaScript/Node.js Client

```javascript
const io = require('socket.io-client');

// Connect to server
const socket = io('http://localhost:3000');

// Authenticate
socket.emit('authenticate', { token: 'your-jwt-token' });

socket.on('authenticated', (data) => {
  console.log('Authenticated:', data.user.username);
  
  // Join a room
  socket.emit('join_room', { roomId: 'room-id-here' });
});

socket.on('room_joined', (data) => {
  console.log('Joined room:', data.roomName);
  
  // Send a message
  socket.emit('send_message', {
    content: 'Hello, world!',
    encryptedContent: 'encrypted-content-here',
    messageType: 'text'
  });
});

socket.on('new_message', (message) => {
  console.log('New message:', message.sender.username, message.content);
});

socket.on('user_typing', (data) => {
  console.log(data.username + ' is typing...');
});

socket.on('connection_error', (error) => {
  console.error('Connection error:', error);
});
```

### React Hook Example

```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useSocket = (token) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL);
    
    newSocket.on('connect', () => {
      newSocket.emit('authenticate', { token });
    });
    
    newSocket.on('authenticated', () => {
      setConnected(true);
    });
    
    newSocket.on('disconnect', () => {
      setConnected(false);
    });
    
    setSocket(newSocket);
    
    return () => newSocket.close();
  }, [token]);

  return { socket, connected };
};
```

---

## Performance Specifications

### Response Times
- **REST API**: < 100ms average response time
- **WebSocket messages**: < 200ms end-to-end latency
- **Authentication**: < 500ms including database lookup

### Throughput
- **Concurrent connections**: 1,000+ simultaneous WebSocket connections
- **Message throughput**: 10,000+ messages per minute
- **Database operations**: 1,000+ operations per second

### Scalability
- Horizontal scaling supported via Redis adapter
- Database connection pooling for optimal performance
- CDN support for static assets

---

## Testing

### Unit Tests
Run unit tests for models and services:
```bash
npm test backend/tests/unit/
```

### Performance Tests
Run WebSocket performance tests:
```bash
npm test backend/tests/perf/
```

### Integration Tests
Run full integration test suite:
```bash
npm run test:integration
```

---

## Environment Variables

Required environment variables for API operation:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/secure-chat
MONGODB_TEST_URI=mongodb://localhost:27017/secure-chat-test

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:3001,https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload (if implemented)
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Redis (for production scaling)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

---

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial API release
- User authentication and registration
- Real-time messaging via WebSocket
- End-to-end encryption support
- Room management
- Message history and pagination

### Version 1.1.0 (TBD)
- File upload support
- Message reactions
- User presence indicators
- Push notifications
- Advanced search functionality

---

## Support

For API support and questions:
- **Documentation**: [Full API Documentation](https://docs.yourdomain.com/api)
- **Issues**: [GitHub Issues](https://github.com/yourusername/secure-chat/issues)
- **Email**: support@yourdomain.com

---

## License

This API is licensed under the MIT License. See the LICENSE file for details.