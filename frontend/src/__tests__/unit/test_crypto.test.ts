/**
 * Unit Tests for Crypto Library
 * Tests all cryptographic functions for correctness and security
 */

import {
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPublicKey,
  importPrivateKey,
  encryptMessage,
  decryptMessage,
  storeKeys,
  loadKeys,
  hasStoredKeys,
  deleteKeys,
  getStoredPublicKey,
  isValidEncryptedMessage,
  generateMessageId,
  CRYPTO_CONFIG
} from '../../lib/crypto';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Crypto Library', () => {
  // Clean up localStorage before each test
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Key Generation', () => {
    test('generateKeyPair should create RSA key pair', async () => {
      const keyPair = await generateKeyPair();
      
      expect(keyPair).toBeDefined();
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKey.algorithm.name).toBe('RSA-OAEP');
      expect(keyPair.privateKey.algorithm.name).toBe('RSA-OAEP');
    });

    test('generateKeyPair should create extractable keys', async () => {
      const keyPair = await generateKeyPair();
      
      expect(keyPair.publicKey.extractable).toBe(true);
      expect(keyPair.privateKey.extractable).toBe(true);
    });

    test('generateKeyPair should create keys with correct usage', async () => {
      const keyPair = await generateKeyPair();
      
      expect(keyPair.publicKey.usages).toContain('encrypt');
      expect(keyPair.privateKey.usages).toContain('decrypt');
    });
  });

  describe('Key Export/Import', () => {
    let testKeyPair: CryptoKeyPair;

    beforeAll(async () => {
      testKeyPair = await generateKeyPair();
    });

    test('exportPublicKey should return string', async () => {
      const publicKeyString = await exportPublicKey(testKeyPair.publicKey);
      
      expect(typeof publicKeyString).toBe('string');
      expect(publicKeyString.length).toBeGreaterThan(0);
    });

    test('exportPrivateKey should return string', async () => {
      const privateKeyString = await exportPrivateKey(testKeyPair.privateKey);
      
      expect(typeof privateKeyString).toBe('string');
      expect(privateKeyString.length).toBeGreaterThan(0);
    });

    test('importPublicKey should recreate public key', async () => {
      const publicKeyString = await exportPublicKey(testKeyPair.publicKey);
      const importedPublicKey = await importPublicKey(publicKeyString);
      
      expect(importedPublicKey).toBeDefined();
      expect(importedPublicKey.algorithm.name).toBe('RSA-OAEP');
      expect(importedPublicKey.usages).toContain('encrypt');
    });

    test('importPrivateKey should recreate private key', async () => {
      const privateKeyString = await exportPrivateKey(testKeyPair.privateKey);
      const importedPrivateKey = await importPrivateKey(privateKeyString);
      
      expect(importedPrivateKey).toBeDefined();
      expect(importedPrivateKey.algorithm.name).toBe('RSA-OAEP');
      expect(importedPrivateKey.usages).toContain('decrypt');
    });
  });

  describe('Message Encryption/Decryption', () => {
    let testKeyPair: CryptoKeyPair;
    const testMessage = 'Hello, this is a test message!';

    beforeAll(async () => {
      testKeyPair = await generateKeyPair();
    });

    test('encryptMessage should encrypt message', async () => {
      const encryptedMessage = await encryptMessage(testMessage, testKeyPair.publicKey);
      
      expect(typeof encryptedMessage).toBe('string');
      expect(encryptedMessage.length).toBeGreaterThan(0);
      expect(encryptedMessage).not.toBe(testMessage);
    });

    test('decryptMessage should decrypt message', async () => {
      const encryptedMessage = await encryptMessage(testMessage, testKeyPair.publicKey);
      const decryptedMessage = await decryptMessage(encryptedMessage, testKeyPair.privateKey);
      
      expect(decryptedMessage).toBe(testMessage);
    });

    test('encryption should be deterministic with different results', async () => {
      const encryptedMessage1 = await encryptMessage(testMessage, testKeyPair.publicKey);
      const encryptedMessage2 = await encryptMessage(testMessage, testKeyPair.publicKey);
      
      // RSA-OAEP should produce different results each time due to random padding
      expect(encryptedMessage1).not.toBe(encryptedMessage2);
    });

    test('should handle empty message encryption', async () => {
      await expect(encryptMessage('', testKeyPair.publicKey))
        .rejects.toThrow('Message cannot be empty');
    });

    test('should handle long message encryption', async () => {
      const longMessage = 'a'.repeat(200); // Exceeds RSA-OAEP limit
      
      await expect(encryptMessage(longMessage, testKeyPair.publicKey))
        .rejects.toThrow('Message too long');
    });

    test('should handle invalid encrypted message decryption', async () => {
      await expect(decryptMessage('invalid-encrypted-data', testKeyPair.privateKey))
        .rejects.toThrow();
    });
  });

  describe('Key Storage', () => {
    let testKeyPair: CryptoKeyPair;
    const testUsername = 'testuser';

    beforeAll(async () => {
      testKeyPair = await generateKeyPair();
    });

    test('storeKeys should save keys to localStorage', async () => {
      await storeKeys(testUsername, testKeyPair);
      
      const storedData = localStorage.getItem(`secure-chat-keys-${testUsername}`);
      expect(storedData).toBeDefined();
      
      const parsedData = JSON.parse(storedData!);
      expect(parsedData.username).toBe(testUsername);
      expect(parsedData.publicKey).toBeDefined();
      expect(parsedData.privateKey).toBeDefined();
      expect(parsedData.timestamp).toBeDefined();
      expect(parsedData.algorithm).toBe('RSA-OAEP');
      expect(parsedData.keySize).toBe(2048);
    });

    test('loadKeys should retrieve keys from localStorage', async () => {
      await storeKeys(testUsername, testKeyPair);
      const loadedKeys = await loadKeys(testUsername);
      
      expect(loadedKeys).toBeDefined();
      expect(loadedKeys!.publicKey).toBeDefined();
      expect(loadedKeys!.privateKey).toBeDefined();
      expect(loadedKeys!.publicKey.algorithm.name).toBe('RSA-OAEP');
      expect(loadedKeys!.privateKey.algorithm.name).toBe('RSA-OAEP');
    });

    test('hasStoredKeys should check key existence', async () => {
      expect(hasStoredKeys(testUsername)).toBe(false);
      
      await storeKeys(testUsername, testKeyPair);
      expect(hasStoredKeys(testUsername)).toBe(true);
    });

    test('deleteKeys should remove keys from localStorage', async () => {
      await storeKeys(testUsername, testKeyPair);
      expect(hasStoredKeys(testUsername)).toBe(true);
      
      deleteKeys(testUsername);
      expect(hasStoredKeys(testUsername)).toBe(false);
    });

    test('getStoredPublicKey should return public key string', async () => {
      await storeKeys(testUsername, testKeyPair);
      const publicKeyString = getStoredPublicKey(testUsername);
      
      expect(publicKeyString).toBeDefined();
      expect(typeof publicKeyString).toBe('string');
      expect(publicKeyString!.length).toBeGreaterThan(0);
    });

    test('loadKeys should return null for non-existent user', async () => {
      const loadedKeys = await loadKeys('nonexistent');
      expect(loadedKeys).toBeNull();
    });

    test('loadKeys should handle corrupted data', async () => {
      localStorage.setItem(`secure-chat-keys-${testUsername}`, 'corrupted-data');
      const loadedKeys = await loadKeys(testUsername);
      
      expect(loadedKeys).toBeNull();
      expect(hasStoredKeys(testUsername)).toBe(false); // Should clean up corrupted data
    });
  });

  describe('End-to-End Encryption Flow', () => {
    test('complete encryption/decryption flow should work', async () => {
      const alice = await generateKeyPair();
      const bob = await generateKeyPair();
      
      const message = 'Secret message from Alice to Bob';
      
      // Alice encrypts message with Bob's public key
      const encryptedMessage = await encryptMessage(message, bob.publicKey);
      
      // Bob decrypts message with his private key
      const decryptedMessage = await decryptMessage(encryptedMessage, bob.privateKey);
      
      expect(decryptedMessage).toBe(message);
    });

    test('cross-key encryption should fail', async () => {
      const alice = await generateKeyPair();
      const bob = await generateKeyPair();
      
      const message = 'Test message';
      const encryptedMessage = await encryptMessage(message, alice.publicKey);
      
      // Bob tries to decrypt Alice's message with his key (should fail)
      await expect(decryptMessage(encryptedMessage, bob.privateKey))
        .rejects.toThrow();
    });
  });

  describe('Utility Functions', () => {
    test('isValidEncryptedMessage should validate encrypted messages', () => {
      // Valid encrypted message (256 bytes for RSA-2048)
      const validEncrypted = 'a'.repeat(256);
      expect(isValidEncryptedMessage(validEncrypted)).toBe(true);
      
      // Invalid messages
      expect(isValidEncryptedMessage('')).toBe(false);
      expect(isValidEncryptedMessage('short')).toBe(false);
      expect(isValidEncryptedMessage('a'.repeat(100))).toBe(false);
      expect(isValidEncryptedMessage('a'.repeat(300))).toBe(false);
    });

    test('generateMessageId should create unique IDs', () => {
      const id1 = generateMessageId();
      const id2 = generateMessageId();
      
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
      expect(id1.includes('-')).toBe(true);
      expect(id2.includes('-')).toBe(true);
    });

    test('CRYPTO_CONFIG should have correct values', () => {
      expect(CRYPTO_CONFIG.ALGORITHM).toBe('RSA-OAEP');
      expect(CRYPTO_CONFIG.KEY_SIZE).toBe(2048);
      expect(CRYPTO_CONFIG.HASH).toBe('SHA-256');
      expect(CRYPTO_CONFIG.MAX_MESSAGE_LENGTH).toBe(190);
    });
  });

  describe('Error Handling', () => {
    test('should handle null/undefined inputs gracefully', async () => {
      const keyPair = await generateKeyPair();
      
      await expect(encryptMessage('test', null as any))
        .rejects.toThrow('Public key is required');
      
      await expect(decryptMessage('test', null as any))
        .rejects.toThrow('Private key is required');
      
      await expect(decryptMessage('', keyPair.privateKey))
        .rejects.toThrow('Encrypted message cannot be empty');
    });

    test('should handle invalid key formats', async () => {
      await expect(importPublicKey('invalid-key-data'))
        .rejects.toThrow();
      
      await expect(importPrivateKey('invalid-key-data'))
        .rejects.toThrow();
    });
  });

  describe('Performance', () => {
    test('key generation should complete within reasonable time', async () => {
      const startTime = Date.now();
      await generateKeyPair();
      const endTime = Date.now();
      
      // Key generation should complete within 5 seconds
      expect(endTime - startTime).toBeLessThan(5000);
    });

    test('encryption should be fast', async () => {
      const keyPair = await generateKeyPair();
      const message = 'Performance test message';
      
      const startTime = Date.now();
      await encryptMessage(message, keyPair.publicKey);
      const endTime = Date.now();
      
      // Encryption should complete within 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('decryption should be fast', async () => {
      const keyPair = await generateKeyPair();
      const message = 'Performance test message';
      const encryptedMessage = await encryptMessage(message, keyPair.publicKey);
      
      const startTime = Date.now();
      await decryptMessage(encryptedMessage, keyPair.privateKey);
      const endTime = Date.now();
      
      // Decryption should complete within 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});