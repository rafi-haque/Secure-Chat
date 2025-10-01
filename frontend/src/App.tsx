import React, { useState, useEffect } from 'react';
import Register from './components/Register';
import UserSearch from './components/UserSearch';
import ChatManager from './components/ChatManager';
import { loadKeys } from './lib/crypto';
import './App.css';

interface ChatUser {
  username: string;
  publicKey: string;
}

interface ActiveChat {
  user: ChatUser;
  id: string;
}

function App() {
  const [currentUser, setCurrentUser] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [privateKey, setPrivateKey] = useState<CryptoKey | undefined>();
  const [activeChats, setActiveChats] = useState<ActiveChat[]>([]);
  const [currentView, setCurrentView] = useState<'register' | 'search'>('register');

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
      // Check if chat with this user is already open
      const existingChat = activeChats.find(chat => chat.user.username === user.username);
      
      if (!existingChat) {
        // Create a new chat
        const newChat: ActiveChat = {
          user: { username: user.username, publicKey: user.publicKey },
          id: `chat-${user.username}-${Date.now()}`
        };
        
        setActiveChats(prev => [...prev, newChat]);
      }
    } else {
      console.error('Cannot start chat: user public key not available');
    }
  };

  const handleCloseChat = (chatId: string) => {
    setActiveChats(prev => prev.filter(chat => chat.id !== chatId));
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
      setActiveChats([]);
      setCurrentView('register');
      
      console.log('Logout successful - all data cleared');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear the UI state even if there's an error
      setCurrentUser('');
      setIsRegistered(false);
      setPrivateKey(undefined);
      setActiveChats([]);
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
      </main>

      {/* Chat bubbles are rendered outside main to be positioned fixed */}
      {isRegistered && (
        <ChatManager
          currentUser={currentUser}
          privateKey={privateKey}
          activeChats={activeChats}
          onCloseChat={handleCloseChat}
        />
      )}

      <footer className="app-footer">
        <p>End-to-end encrypted messaging • Your messages are secure</p>
      </footer>
    </div>
  );
}

export default App;
