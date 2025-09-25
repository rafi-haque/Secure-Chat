# 🔐 Secure Chat Application

A full-stack secure chat application featuring end-to-end encryption, real-time messaging, and user management. Built with React frontend and Node.js backend.

## 🌟 Features

- **End-to-End Encryption**: Messages are encrypted using RSA-OAEP with 2048-bit keys
- **Real-time Messaging**: WebSocket-based chat with typing indicators
- **User Management**: Registration, authentication, and user discovery
- **Secure Key Storage**: Private keys stored locally on user devices
- **Modern UI**: Responsive React-based user interface
- **Test Coverage**: Comprehensive test suites for both frontend and backend

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│    MongoDB      │
│   (React)       │     │   (Node.js)     │     │   (Database)    │
│   Port: 3000    │     │   Port: 5000    │     │   Port: 27017   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │
         └────────────────────────┘
              WebSocket (Port: 3001)
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v16+ and npm
- **MongoDB** running locally or connection string
- **Git** for version control

### 1. Clone Repository

```bash
git clone https://github.com/your-username/secure-chat.git
cd secure-chat
```

### 2. Development Setup

```bash
# Set up environment variables (IMPORTANT!)
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and generate a secure JWT secret

# Install dependencies for both frontend and backend
./scripts/dev-setup.sh

# Start both frontend and backend in development mode
./scripts/dev-start.sh
```

> 🔒 **Security Note**: Please read `SECURITY.md` before deployment. Never commit `.env` files or expose sensitive credentials.

### 3. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## 📁 Project Structure

```
secure-chat/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── api/            # API routes
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   └── server.js       # Main server file
│   ├── tests/              # Backend tests
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── lib/           # Utility libraries
│   │   └── __tests__/     # Frontend tests
│   └── package.json
├── deployment/             # Deployment scripts
├── docs/                  # API documentation
├── scripts/               # Development scripts
└── README.md              # This file
```

## 🛠️ Development

### Manual Setup

If you prefer manual setup instead of scripts:

#### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB connection
npm run dev
```

#### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Run all tests
./scripts/test-all.sh
```

### Environment Variables

Create `backend/.env` file:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/secure-chat-dev
JWT_SECRET=your-super-secret-jwt-key-change-in-production
BCRYPT_ROUNDS=12
WEBSOCKET_PORT=3001
LOG_LEVEL=info
```

## 🔐 Security Features

### Encryption Implementation

- **Algorithm**: RSA-OAEP with SHA-256
- **Key Size**: 2048 bits
- **Key Storage**: Local browser storage (private keys never leave the device)
- **Message Limits**: Up to 190 bytes per message (due to RSA padding)

### Security Best Practices

- Private keys are generated and stored locally
- Public keys are shared with the server for user discovery
- Messages are encrypted client-side before transmission
- No private keys are ever transmitted to the server

## 📚 API Documentation

See [docs/api.md](docs/api.md) for complete API documentation.

### Key Endpoints

- `POST /api/register` - Register new user
- `GET /api/users/search/{query}` - Search for users
- `GET /api/users/{username}/publickey` - Get user's public key
- `GET /health` - Health check

### WebSocket Events

- `authenticate` - Authenticate user with server
- `send_message` - Send encrypted message to another user
- `receive_message` - Receive encrypted message
- `typing_start/stop` - Typing indicators

## 🚢 Deployment

### Development Deployment

```bash
# Build and test locally
./scripts/build.sh

# Start production builds locally
./scripts/prod-start.sh
```

### Production Deployment

#### Frontend (GitHub Pages)

```bash
./deployment/deploy-frontend.sh
```

#### Backend (Heroku)

```bash
./deployment/deploy-backend-heroku.sh
```

#### Backend (Azure)

```bash
./deployment/deploy-backend-azure.sh
```

See [deployment/README.md](deployment/README.md) for detailed deployment instructions.

## 🧪 Testing

### Test Coverage

- **Backend**: 60/64 tests passing (93.75%)
- **Frontend**: 36/36 tests passing (100%)
- **Total Coverage**: 96/100 tests passing

### Test Categories

- **Unit Tests**: Individual component/function testing
- **Integration Tests**: API and component integration
- **Contract Tests**: API contract validation
- **Performance Tests**: WebSocket and database performance

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```bash
   # Ensure MongoDB is running
   mongod --version
   # or use MongoDB Atlas connection string
   ```

2. **Port Already in Use**
   ```bash
   # Kill processes on ports 3000, 5000, 3001
   lsof -ti:3000,5000,3001 | xargs kill -9
   ```

3. **Frontend API Calls Failing**
   - Ensure backend is running on port 5000
   - Check proxy configuration in frontend/package.json

4. **WebSocket Connection Issues**
   - Verify backend WebSocket server is on port 3001
   - Check CORS configuration in backend

### Debug Mode

```bash
# Start backend with detailed logging
cd backend && LOG_LEVEL=debug npm run dev

# Start frontend with debug info
cd frontend && REACT_APP_DEBUG=true npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`./scripts/test-all.sh`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review API documentation in `docs/api.md`

---

**Built with ❤️ for secure communication**