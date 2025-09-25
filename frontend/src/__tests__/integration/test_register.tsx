import { render, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Register from '../../components/Register';

jest.mock('../../lib/crypto', () => ({
  generateKeyPair: jest.fn().mockResolvedValue({
    publicKey: 'mock-public-key',
    privateKey: 'mock-private-key'
  }),
  storeKeys: jest.fn().mockResolvedValue(undefined),
  exportPublicKey: jest.fn().mockResolvedValue('mock-public-key'),
  hasStoredKeys: jest.fn().mockReturnValue(false),
  deleteKeys: jest.fn().mockReturnValue(undefined)
}));

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Ensure hasStoredKeys returns false
    const crypto = require('../../lib/crypto');
    crypto.hasStoredKeys.mockReturnValue(false);
  });

  it('should render form correctly', () => {
    const { getByPlaceholderText, getByText } = render(<Register />);
    
    const usernameInput = getByPlaceholderText('Enter your username');
    const registerButton = getByText('Register');
    
    expect(usernameInput).toBeInTheDocument();
    expect(registerButton).toBeInTheDocument();
    expect(registerButton).toBeDisabled();
    expect(usernameInput).toHaveValue('');
  });

  it('should show security notice', () => {
    const { getByText } = render(<Register />);
    
    expect(getByText('🔒 Security Notice')).toBeInTheDocument();
    expect(getByText(/Your private key is generated and stored locally/)).toBeInTheDocument();
  });

  it('should not show form when user is already registered', () => {
    // Set up existing user
    localStorage.setItem('username', 'existinguser');
    const crypto = require('../../lib/crypto');
    crypto.hasStoredKeys.mockReturnValue(true);
    
    const { queryByPlaceholderText, getByText } = render(<Register />);
    
    // Form shouldn't be visible
    expect(queryByPlaceholderText('Enter your username')).not.toBeInTheDocument();
    expect(getByText(/Already registered as existinguser/)).toBeInTheDocument();
  });
});
