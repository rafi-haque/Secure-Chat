const crypto = require('crypto');

class EncryptionService {
  /**
   * Generate RSA key pair
   * @returns {Object} Key pair object
   */
  generateKeyPair() {
    try {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });

      return {
        success: true,
        publicKey: publicKey,
        privateKey: privateKey
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Encrypt data with public key
   * @param {string} data - Data to encrypt
   * @param {string} publicKey - Public key in PEM format
   * @returns {Object} Encryption result
   */
  encryptWithPublicKey(data, publicKey) {
    try {
      const buffer = Buffer.from(data, 'utf8');
      const encrypted = crypto.publicEncrypt(publicKey, buffer);
      
      return {
        success: true,
        encryptedData: encrypted.toString('base64')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Decrypt data with private key
   * @param {string} encryptedData - Base64 encoded encrypted data
   * @param {string} privateKey - Private key in PEM format
   * @returns {Object} Decryption result
   */
  decryptWithPrivateKey(encryptedData, privateKey) {
    try {
      const buffer = Buffer.from(encryptedData, 'base64');
      const decrypted = crypto.privateDecrypt(privateKey, buffer);
      
      return {
        success: true,
        decryptedData: decrypted.toString('utf8')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate random symmetric key
   * @returns {string} Base64 encoded symmetric key
   */
  generateSymmetricKey() {
    try {
      const key = crypto.randomBytes(32); // 256-bit key
      return {
        success: true,
        key: key.toString('base64')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Encrypt data with symmetric key using AES
   * @param {string} data - Data to encrypt
   * @param {string} key - Base64 encoded symmetric key
   * @returns {Object} Encryption result
   */
  encryptSymmetric(data, key) {
    try {
      const keyBuffer = Buffer.from(key, 'base64');
      const iv = crypto.randomBytes(16); // 128-bit IV for AES
      const cipher = crypto.createCipher('aes-256-cbc', keyBuffer);
      cipher.setAutoPadding(true);
      
      let encrypted = cipher.update(data, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      return {
        success: true,
        encryptedData: encrypted,
        iv: iv.toString('base64')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Decrypt data with symmetric key using AES
   * @param {string} encryptedData - Base64 encoded encrypted data
   * @param {string} key - Base64 encoded symmetric key
   * @param {string} iv - Base64 encoded initialization vector
   * @returns {Object} Decryption result
   */
  decryptSymmetric(encryptedData, key, iv) {
    try {
      const keyBuffer = Buffer.from(key, 'base64');
      const decipher = crypto.createDecipher('aes-256-cbc', keyBuffer);
      decipher.setAutoPadding(true);
      
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return {
        success: true,
        decryptedData: decrypted
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate encrypted message format
   * @param {string} message - Encrypted message to validate
   * @returns {boolean} True if valid format
   */
  isValidEncryptedMessage(message) {
    if (!message || typeof message !== 'string') {
      return false;
    }
    // Simple validation - encrypted messages should be base64 and reasonably long
    return message.length > 16 && /^[A-Za-z0-9+/=]+$/.test(message);
  }

  /**
   * Generate secure message ID
   * @returns {string} Unique message ID
   */
  generateMessageId() {
    const bytes = crypto.randomBytes(16).toString('hex');
    // Format as UUID-like string with dashes
    return `${bytes.slice(0, 8)}-${bytes.slice(8, 12)}-${bytes.slice(12, 16)}-${bytes.slice(16, 20)}-${bytes.slice(20, 32)}`;
  }

  /**
   * Validate public key format
   * @param {string} publicKey - Public key to validate
   * @returns {boolean} True if valid PEM format
   */
  isValidPublicKey(publicKey) {
    if (!publicKey || typeof publicKey !== 'string') {
      return false;
    }
    // Check for PEM format markers
    return publicKey.includes('-----BEGIN PUBLIC KEY-----') && 
           publicKey.includes('-----END PUBLIC KEY-----');
  }

  /**
   * Sanitize message content
   * @param {string} content - Message content to sanitize
   * @returns {string} Sanitized content
   */
  sanitizeMessageContent(content) {
    if (!content || typeof content !== 'string') {
      return '';
    }
    // Basic XSS prevention - remove script tags and dangerous elements
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
}

module.exports = new EncryptionService();