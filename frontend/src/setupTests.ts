// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

/**
 * Jest Setup for Crypto API Mocking
 * Provides browser crypto APIs in Node.js test environment
 */

import { webcrypto } from 'crypto';
import { TextEncoder, TextDecoder } from 'util';

// Add TextEncoder and TextDecoder to global scope
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Mock Web Crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: webcrypto.subtle,
    getRandomValues: (arr: Uint8Array): Uint8Array => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }
  }
});

// Mock window object for crypto
Object.defineProperty(global, 'window', {
  value: {
    crypto: global.crypto
  }
});

// Create a proper localStorage mock
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  
  return {
    get store() { return store; },
    set store(newStore) { store = newStore; },
    get length() {
      return Object.keys(store).length;
    },
    key(index: number): string | null {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    getItem(key: string): string | null {
      return store.hasOwnProperty(key) ? store[key] : null;
    },
    setItem(key: string, value: string): void {
      store[key] = value;
    },
    removeItem(key: string): void {
      delete store[key];
    },
    clear(): void {
      store = {};
    }
  };
};

const localStorageMock = createLocalStorageMock();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

// Reset localStorage before each test  
beforeEach(() => {
  // Clear the actual store data
  localStorageMock.clear();
});

// Debug helper for localStorage
(global as any).debugLocalStorage = () => {
  console.log('localStorage contents:', localStorageMock.store);
};
