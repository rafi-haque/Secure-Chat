import React, { useState, useEffect } from 'react';
import Register from './components/Register';
import UserSearch from './components/UserSearch';
import ChatWindow from './components/ChatWindow';
import { loadKeys } from './lib/crypto';
import './App.css';

interface ChatUser {
  username: string;
  publicKey: string;
}

function App() {
  const [currentUser, setCurrentUser] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [privateKey, setPrivateKey] = useState<CryptoKey | undefined>();
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [currentView, setCurrentView] = useState<'register' | 'search' | 'chat'>('register');

  // Check for existing registration on app load
  useEffect(() => {
    const checkRegistration = async () => {
      const storedUsername = localStorage.getItem('username');
      
      if (storedUsername) {
        const keys = await loadKeys(storedUsername);
        
        if (keys) {
          setCurrentUser(storedUsername);
          setPrivateKey(keys.privateKey);
          setIsRegistered(true);
          setCurrentView('search');
        } else {
          // Keys not found, clear username and show registration
          localStorage.removeItem('username');
          setCurrentView('register');
        }
      }
    };

    checkRegistration();
  }, []);

  const handleRegistrationSuccess = async (username: string) => {
    setCurrentUser(username);
    setIsRegistered(true);
    
    // Load the keys for this user
    const keys = await loadKeys(username);
    if (keys) {
      setPrivateKey(keys.privateKey);
    }
    
    setCurrentView('search');
  };

  const handleUserSelect = (user: { username: string; publicKey?: string }) => {
    if (user.publicKey) {
      setSelectedUser({ username: user.username, publicKey: user.publicKey });
      setCurrentView('chat');
    } else {
      console.error('Cannot start chat: user public key not available');
    }
  };

  const handleBackToSearch = () => {
    setSelectedUser(null);
    setCurrentView('search');
  };

  const handleLogout = async () => {
    try {
      // Clear stored keys for the current user
      if (currentUser) {
        const { deleteKeys } = await import('./lib/crypto');
        deleteKeys(currentUser);
      }
      
      // Clear username from localStorage
      localStorage.removeItem('username');
      
      // Clear all UI state
      setCurrentUser('');
      setIsRegistered(false);
      setPrivateKey(undefined);
      setSelectedUser(null);
      setCurrentView('register');
      
      console.log('Logout successful - all data cleared');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear the UI state even if there's an error
      setCurrentUser('');
      setIsRegistered(false);
      setPrivateKey(undefined);
      setSelectedUser(null);
      setCurrentView('register');
      localStorage.removeItem('username');
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🔐 Secure Chat</h1>
        {isRegistered && (
          <div className="user-info">
            <span>Logged in as: <strong>@{currentUser}</strong></span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        )}
      </header>

      <main className="app-main">
        {currentView === 'register' && (
          <Register onRegistrationSuccess={handleRegistrationSuccess} />
        )}

        {currentView === 'search' && (
          <UserSearch 
            onUserSelect={handleUserSelect}
            currentUsername={currentUser}
          />
        )}

        {currentView === 'chat' && selectedUser && (
          <ChatWindow
            currentUser={currentUser}
            chatUser={selectedUser}
            privateKey={privateKey}
            onClose={handleBackToSearch}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>End-to-end encrypted messaging • Your messages are secure</p>
      </footer>
    </div>
  );
}

export default App;
