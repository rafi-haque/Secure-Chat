import React, { useState, useEffect } from 'react';
import { generateKeyPair, storeKeys, exportPublicKey, hasStoredKeys, deleteKeys } from '../lib/crypto';
import './Register.css';

interface RegisterProps {
  onRegistrationSuccess?: (username: string) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegistrationSuccess }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if user is already registered
  useEffect(() => {
    const existingUsername = localStorage.getItem('username');
    
    if (existingUsername && hasStoredKeys(existingUsername)) {
      setSuccess(`Already registered as ${existingUsername}`);
      if (onRegistrationSuccess) {
        onRegistrationSuccess(existingUsername);
      }
    }
  }, [onRegistrationSuccess]);



  const validateUsername = (username: string): string | null => {
    if (!username) {
      return 'Username is required';
    }

    const trimmedUsername = username.trim();
    
    if (trimmedUsername.length < 3) {
      return 'Username must be at least 3 characters long';
    }

    if (trimmedUsername.length > 30) {
      return 'Username must not exceed 30 characters';
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return 'Username can only contain letters, numbers, and underscores';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate username
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Generate key pair using crypto library
      const keyPair = await generateKeyPair();
      const publicKeyString = await exportPublicKey(keyPair.publicKey);

      // Register with server
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username.trim(),
          publicKey: publicKeyString
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store keys and username using crypto library
        await storeKeys(username.trim(), keyPair);
        localStorage.setItem('username', username.trim());
        
        setSuccess('Registration successful! You can now start chatting.');
        setUsername('');

        if (onRegistrationSuccess) {
          onRegistrationSuccess(username.trim());
        }
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearStorage = () => {
    const existingUsername = localStorage.getItem('username');
    if (existingUsername) {
      deleteKeys(existingUsername);
    }
    localStorage.removeItem('username');
    setSuccess('');
    setError('Storage cleared. You can register again.');
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Secure Chat Registration</h2>
        <p className="register-description">
          Create your secure chat account. Your private key will be generated and stored locally on your device.
        </p>

        {success && (
          <div className="alert alert-success">
            {success}
            {localStorage.getItem('username') && (
              <button 
                type="button" 
                className="clear-button"
                onClick={handleClearStorage}
              >
                Register Different Account
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {!localStorage.getItem('username') && (
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={isLoading}
                maxLength={30}
                autoComplete="username"
              />
              <small className="form-hint">
                3-30 characters, letters, numbers, and underscores only
              </small>
            </div>

            <button 
              type="submit" 
              className="register-button"
              disabled={isLoading || !username.trim()}
            >
              {isLoading ? 'Generating Keys & Registering...' : 'Register'}
            </button>
          </form>
        )}

        <div className="security-notice">
          <h4>🔒 Security Notice</h4>
          <ul>
            <li>Your private key is generated and stored locally on your device</li>
            <li>The server only stores your username and public key</li>
            <li>If you lose access to this device, your messages cannot be recovered</li>
            <li>Never share your private key with anyone</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Register;