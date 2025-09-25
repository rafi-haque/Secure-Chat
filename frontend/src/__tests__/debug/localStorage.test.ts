/**
 * Debug test for localStorage functionality
 */

import { storeKeys, loadKeys, hasStoredKeys, deleteKeys, generateKeyPair } from '../../lib/crypto';

describe('Debug localStorage', () => {
  let testKeyPair: CryptoKeyPair;
  const testUsername = 'debuguser';

  beforeAll(async () => {
    testKeyPair = await generateKeyPair();
  });

  test('debug storeKeys', async () => {
    console.log('Starting storeKeys test...');
    console.log('localStorage before:', (localStorage as any).store);
    
    // Test basic localStorage functionality
    localStorage.setItem('test-key', 'test-value');
    const basicTest = localStorage.getItem('test-key');
    console.log('Basic localStorage test:', basicTest);
    
    try {
      await storeKeys(testUsername, testKeyPair);
      console.log('storeKeys completed successfully');
      console.log('localStorage after storeKeys:', (localStorage as any).store);
      
      const storedData = localStorage.getItem(`secure-chat-keys-${testUsername}`);
      console.log('Retrieved data:', storedData);
      console.log('Direct store access:', (localStorage as any).store[`secure-chat-keys-${testUsername}`]);
      
      expect(storedData).not.toBeNull();
    } catch (error) {
      console.error('storeKeys failed:', error);
      throw error;
    }
  });
});