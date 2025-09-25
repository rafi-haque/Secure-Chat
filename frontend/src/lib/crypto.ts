/**
 * Cryptographic utilities for secure chat application
 * Implements RSA-OAEP encryption/decryption with Web Crypto API
 */

// Key generation parameters
const KEY_ALGORITHM = {
  name: 'RSA-OAEP',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: 'SHA-256'
};

// Import/Export parameters
const IMPORT_EXPORT_ALGORITHM = {
  name: 'RSA-OAEP',
  hash: 'SHA-256'
};

/**
 * Generate a new RSA key pair for encryption
 * @returns Promise<CryptoKeyPair> The generated key pair
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      KEY_ALGORITHM,
      true, // extractable
      ['encrypt', 'decrypt']
    );
    
    return keyPair;
  } catch (error) {
    console.error('Key generation failed:', error);
    throw new Error('Failed to generate encryption keys');
  }
}

/**
 * Export a public key to a string format for sharing
 * @param publicKey The public key to export
 * @returns Promise<string> Base64-encoded public key
 */
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  try {
    const exported = await window.crypto.subtle.exportKey('spki', publicKey);
    const exportedBytes = new Uint8Array(exported);
    
    // Convert to string using String.fromCharCode.apply to avoid TypeScript issues
    return String.fromCharCode.apply(null, Array.from(exportedBytes));
  } catch (error) {
    console.error('Public key export failed:', error);
    throw new Error('Failed to export public key');
  }
}

/**
 * Export a private key to a string format for local storage
 * @param privateKey The private key to export
 * @returns Promise<string> Base64-encoded private key
 */
export async function exportPrivateKey(privateKey: CryptoKey): Promise<string> {
  try {
    const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
    const exportedBytes = new Uint8Array(exported);
    
    // Convert to string using String.fromCharCode.apply to avoid TypeScript issues
    return String.fromCharCode.apply(null, Array.from(exportedBytes));
  } catch (error) {
    console.error('Private key export failed:', error);
    throw new Error('Failed to export private key');
  }
}

/**
 * Import a public key from string format
 * @param publicKeyString The string representation of the public key
 * @returns Promise<CryptoKey> The imported public key
 */
export async function importPublicKey(publicKeyString: string): Promise<CryptoKey> {
  try {
    const publicKeyBytes = new Uint8Array(
      publicKeyString.split('').map(char => char.charCodeAt(0))
    );
    
    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      publicKeyBytes,
      IMPORT_EXPORT_ALGORITHM,
      false, // not extractable
      ['encrypt']
    );
    
    return publicKey;
  } catch (error) {
    console.error('Public key import failed:', error);
    throw new Error('Failed to import public key');
  }
}

/**
 * Import a private key from string format
 * @param privateKeyString The string representation of the private key
 * @returns Promise<CryptoKey> The imported private key
 */
export async function importPrivateKey(privateKeyString: string): Promise<CryptoKey> {
  try {
    const privateKeyBytes = new Uint8Array(
      privateKeyString.split('').map(char => char.charCodeAt(0))
    );
    
    const privateKey = await window.crypto.subtle.importKey(
      'pkcs8',
      privateKeyBytes,
      IMPORT_EXPORT_ALGORITHM,
      false, // not extractable
      ['decrypt']
    );
    
    return privateKey;
  } catch (error) {
    console.error('Private key import failed:', error);
    throw new Error('Failed to import private key');
  }
}

/**
 * Encrypt a message using a public key
 * @param message The plaintext message to encrypt
 * @param publicKey The recipient's public key
 * @returns Promise<string> The encrypted message as a string
 */
export async function encryptMessage(message: string, publicKey: CryptoKey): Promise<string> {
  try {
    // Validate input
    if (!message || message.length === 0) {
      throw new Error('Message cannot be empty');
    }
    
    if (!publicKey) {
      throw new Error('Public key is required');
    }
    
    // Check message length (RSA-OAEP has size limits)
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(message);
    
    // RSA-OAEP with 2048-bit key and SHA-256 can encrypt up to 190 bytes
    if (messageBytes.length > 190) {
      throw new Error('Message too long for RSA encryption (max 190 bytes)');
    }
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      publicKey,
      messageBytes
    );
    
    const encryptedBytes = new Uint8Array(encrypted);
    
    // Convert to string using String.fromCharCode.apply to avoid TypeScript issues
    return String.fromCharCode.apply(null, Array.from(encryptedBytes));
  } catch (error) {
    console.error('Message encryption failed:', error);
    throw new Error(`Failed to encrypt message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt a message using a private key
 * @param encryptedMessage The encrypted message string
 * @param privateKey The recipient's private key
 * @returns Promise<string> The decrypted plaintext message
 */
export async function decryptMessage(encryptedMessage: string, privateKey: CryptoKey): Promise<string> {
  try {
    // Validate input
    if (!encryptedMessage || encryptedMessage.length === 0) {
      throw new Error('Encrypted message cannot be empty');
    }
    
    if (!privateKey) {
      throw new Error('Private key is required');
    }
    
    const encryptedBytes = new Uint8Array(
      encryptedMessage.split('').map(char => char.charCodeAt(0))
    );
    
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP'
      },
      privateKey,
      encryptedBytes
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Message decryption failed:', error);
    throw new Error(`Failed to decrypt message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Store keys securely in localStorage with additional metadata
 * @param username The username associated with the keys
 * @param keyPair The key pair to store
 */
export async function storeKeys(username: string, keyPair: CryptoKeyPair): Promise<void> {
  try {
    const publicKeyString = await exportPublicKey(keyPair.publicKey);
    const privateKeyString = await exportPrivateKey(keyPair.privateKey);
    
    const keyData = {
      username,
      publicKey: publicKeyString,
      privateKey: privateKeyString,
      timestamp: new Date().toISOString(),
      algorithm: 'RSA-OAEP',
      keySize: 2048
    };
    
    localStorage.setItem(`secure-chat-keys-${username}`, JSON.stringify(keyData));
  } catch (error) {
    console.error('Key storage failed:', error);
    throw new Error('Failed to store encryption keys');
  }
}

/**
 * Load keys from localStorage
 * @param username The username to load keys for
 * @returns Promise<{publicKey: CryptoKey, privateKey: CryptoKey} | null>
 */
export async function loadKeys(username: string): Promise<{publicKey: CryptoKey, privateKey: CryptoKey} | null> {
  try {
    const keyDataString = localStorage.getItem(`secure-chat-keys-${username}`);
    
    if (!keyDataString) {
      return null;
    }
    
    const keyData = JSON.parse(keyDataString);
    
    // Validate key data structure
    if (!keyData.publicKey || !keyData.privateKey) {
      throw new Error('Invalid key data format');
    }
    
    const publicKey = await importPublicKey(keyData.publicKey);
    const privateKey = await importPrivateKey(keyData.privateKey);
    
    return { publicKey, privateKey };
  } catch (error) {
    console.error('Key loading failed:', error);
    // Clean up corrupted key data
    localStorage.removeItem(`secure-chat-keys-${username}`);
    return null;
  }
}

/**
 * Check if keys exist for a username
 * @param username The username to check
 * @returns boolean True if keys exist
 */
export function hasStoredKeys(username: string): boolean {
  const keyDataString = localStorage.getItem(`secure-chat-keys-${username}`);
  return keyDataString !== null;
}

/**
 * Delete stored keys for a username
 * @param username The username to delete keys for
 */
export function deleteKeys(username: string): void {
  localStorage.removeItem(`secure-chat-keys-${username}`);
}

/**
 * Get the stored public key string for a username
 * @param username The username to get the public key for
 * @returns string | null The public key string or null if not found
 */
export function getStoredPublicKey(username: string): string | null {
  try {
    const keyDataString = localStorage.getItem(`secure-chat-keys-${username}`);
    
    if (!keyDataString) {
      return null;
    }
    
    const keyData = JSON.parse(keyDataString);
    return keyData.publicKey || null;
  } catch (error) {
    console.error('Failed to get stored public key:', error);
    return null;
  }
}

/**
 * Validate that a string appears to be a valid encrypted message
 * @param encryptedMessage The message to validate
 * @returns boolean True if the message appears to be validly encrypted
 */
export function isValidEncryptedMessage(encryptedMessage: string): boolean {
  // Basic validation - encrypted messages should be non-empty and have reasonable length
  if (!encryptedMessage || encryptedMessage.length < 10) {
    return false;
  }
  
  // RSA-2048 encrypted data should be exactly 256 bytes
  if (encryptedMessage.length !== 256) {
    return false;
  }
  
  return true;
}

/**
 * Generate a secure random message ID
 * @returns string A unique message identifier
 */
export function generateMessageId(): string {
  const timestamp = Date.now().toString(36);
  const randomBytes = new Uint8Array(8);
  window.crypto.getRandomValues(randomBytes);
  const randomString = Array.from(randomBytes, byte => byte.toString(36)).join('');
  
  return `${timestamp}-${randomString}`;
}

// Export configuration constants for use in other modules
export const CRYPTO_CONFIG = {
  ALGORITHM: 'RSA-OAEP',
  KEY_SIZE: 2048,
  HASH: 'SHA-256',
  MAX_MESSAGE_LENGTH: 190 // bytes
};