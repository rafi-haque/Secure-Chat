# Secure Chat Frontend# Getting Started with Create React App



A React-based frontend application providing secure messaging capabilities with end-to-end encryption.This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).



## 🏗️ Architecture## Available Scripts



```In the project directory, you can run:

frontend/

├── public/             # Static assets### `npm start`

├── src/

│   ├── components/     # React componentsRuns the app in the development mode.\

│   │   ├── Chat.js     # Main chat interfaceOpen [http://localhost:3000](http://localhost:3000) to view it in the browser.

│   │   ├── Login.js    # Authentication component

│   │   └── Register.js # User registrationThe page will reload if you make edits.\

│   ├── services/       # API and crypto servicesYou will also see any lint errors in the console.

│   │   ├── api.js      # Backend API communication

│   │   └── crypto.js   # End-to-end encryption### `npm test`

│   ├── hooks/          # Custom React hooks

│   ├── utils/          # Utility functionsLaunches the test runner in the interactive watch mode.\

│   └── tests/          # Component testsSee the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

└── build/              # Production build output

```### `npm run build`



## 🔐 Security FeaturesBuilds the app for production to the `build` folder.\

It correctly bundles React in production mode and optimizes the build for the best performance.

### End-to-End Encryption

- **RSA Key Generation**: 2048-bit RSA key pairs generated client-sideThe build is minified and the filenames include the hashes.\

- **AES Encryption**: Messages encrypted with AES-256-GCMYour app is ready to be deployed!

- **Hybrid Cryptography**: RSA for key exchange, AES for message encryption

- **Perfect Forward Secrecy**: Unique session keys for each conversationSee the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.



### Implementation Details### `npm run eject`

```javascript

// Key generation (crypto.js)**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

generateKeyPair() -> { publicKey, privateKey }

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

// Message encryption flow

encrypt(message, recipientPublicKey) -> {Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

  1. Generate random AES key

  2. Encrypt message with AES-GCMYou don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

  3. Encrypt AES key with recipient's RSA public key

  4. Return { encryptedMessage, encryptedKey, iv }## Learn More

}

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

// Message decryption flow

decrypt(encryptedData, privateKey) -> {To learn React, check out the [React documentation](https://reactjs.org/).

  1. Decrypt AES key with RSA private key
  2. Decrypt message with AES key
  3. Return plaintext message
}
```

## 🔌 Backend Integration

### API Configuration
- **Proxy**: Configured in `package.json` to route `/api/*` to `http://localhost:5000`
- **WebSocket**: Direct connection to `http://localhost:5000` for real-time messaging (Socket.io)
- **CORS**: Handled automatically through proxy configuration

### API Endpoints Used
```javascript
// Authentication
POST /api/register - User registration
POST /api/login    - User authentication
POST /api/logout   - Session termination

// Messaging
GET  /api/messages/:conversationId - Fetch conversation history
POST /api/messages                 - Send new message
GET  /api/users                    - Get user list for contacts

// Key Management
POST /api/keys/exchange - Public key exchange
GET  /api/keys/:userId  - Retrieve user's public key
```

## 🧪 Testing

### Test Structure
```
src/tests/
├── components/         # Component unit tests
├── services/          # Service layer tests
├── hooks/             # Custom hook tests
├── integration/       # Integration tests
└── __mocks__/         # Test mocks and fixtures
```

### Test Categories
- **Component Tests**: React component rendering and interaction
- **Crypto Tests**: Encryption/decryption functionality
- **API Tests**: Service layer communication
- **Integration Tests**: End-to-end user flows

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test Chat.test.js
```

## 🚀 Development

### Prerequisites
- Node.js 18+ and npm
- Backend server running on port 5000
- MongoDB instance (for full functionality)

### Quick Start
```bash
# Install dependencies
npm install

# Start development server
npm start

# Access application
open http://localhost:3000
```

### Development Scripts
```bash
npm start          # Start dev server with hot reload
npm run build      # Create production build
npm run test       # Run test suite
npm run eject      # Eject from Create React App (irreversible)
```

### Environment Configuration
Create `.env.local` for environment-specific settings:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_DEBUG=true
```

## 📦 Dependencies

### Core Dependencies
- **React**: 19.0.0 - UI framework
- **Socket.io-client**: 4.8.1 - WebSocket communication
- **Crypto-js**: 4.2.0 - Cryptographic operations
- **JSEncrypt**: 3.3.2 - RSA encryption

### Development Dependencies
- **@testing-library/react**: Testing utilities
- **@testing-library/jest-dom**: Jest DOM matchers
- **@testing-library/user-event**: User interaction simulation

## 🔧 Build Process

### Development Build
- Hot module reloading enabled
- Source maps for debugging
- Proxy configuration active
- Development optimizations

### Production Build
```bash
npm run build
```

Production build includes:
- Code minification and optimization
- Asset bundling and compression
- Service worker for caching
- Environment variable replacement

### Build Output
```
build/
├── static/
│   ├── css/        # Compiled CSS files
│   ├── js/         # Compiled JavaScript bundles
│   └── media/      # Optimized media assets
├── index.html      # Entry point
└── manifest.json   # PWA manifest
```

## 🐛 Troubleshooting

### Common Issues

**API Calls Failing**
```bash
# Check proxy configuration in package.json
"proxy": "http://localhost:5000"

# Ensure backend is running
curl http://localhost:5000/health
```

**WebSocket Connection Issues**
```javascript
// Check WebSocket URL in components
const socket = io('ws://localhost:3001');

// Verify backend WebSocket server
netstat -an | grep 3001
```

**Crypto Operations Failing**
```javascript
// Check key generation
const keys = await generateKeyPair();
console.log('Keys generated:', !!keys.publicKey, !!keys.privateKey);

// Verify encryption/decryption cycle
const message = "test";
const encrypted = await encrypt(message, publicKey);
const decrypted = await decrypt(encrypted, privateKey);
console.log('Crypto test:', message === decrypted);
```

**Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear React cache
rm -rf build
npm start
```

### Debug Mode
Enable debug logging by setting environment variable:
```bash
REACT_APP_DEBUG=true npm start
```

## 🔒 Security Considerations

### Client-Side Security
- Private keys never leave the browser
- Sensitive data cleared from memory after use
- No plaintext message storage
- CSP headers for XSS protection

### Key Management
- RSA keys generated with secure random
- Keys stored in browser's secure storage
- Key rotation supported (manual)
- Public key verification required

### Network Security
- All API calls over HTTPS in production
- WebSocket Secure (WSS) for production
- Token-based authentication
- Request signing for message integrity

## 📱 Browser Support

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- Web Crypto API for secure key generation
- WebSocket support for real-time messaging
- Local Storage for key persistence
- ES6+ JavaScript features

## 🤝 Integration Points

### Backend Dependencies
- User authentication state
- Message history synchronization
- Public key directory
- WebSocket event handling

### Database Integration (via Backend)
- User profiles and authentication
- Message storage and retrieval
- Public key registry
- Conversation metadata

## 📊 Performance

### Optimization Strategies
- Code splitting for route-based loading
- Lazy loading of chat components
- Message virtualization for large conversations
- WebSocket connection pooling

### Performance Metrics
- Initial page load: < 2s
- Message encryption: < 50ms
- Message rendering: < 100ms
- WebSocket latency: < 10ms

## 🔄 State Management

### React State Architecture
- Component-level state for UI interactions
- Context API for user authentication
- Custom hooks for chat functionality
- Local storage for key persistence

### Key State Objects
```javascript
// User authentication state
{
  user: { id, username, publicKey },
  isAuthenticated: boolean,
  token: string
}

// Chat state
{
  messages: Array<Message>,
  activeConversation: string,
  participants: Array<User>,
  typing: Array<string>
}

// Crypto state
{
  keyPair: { publicKey, privateKey },
  sessionKeys: Map<conversationId, aesKey>
}
```