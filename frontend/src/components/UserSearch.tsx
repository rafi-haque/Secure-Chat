import React, { useState, useEffect, useCallback } from 'react';
import './UserSearch.css';

interface User {
  username: string;
  publicKey?: string;
}

interface UserSearchProps {
  onUserSelect?: (user: User) => void;
  currentUsername?: string;
}

const UserSearch: React.FC<UserSearchProps> = ({ onUserSelect, currentUsername }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Search function
  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/users/search/${encodeURIComponent(query.trim())}`);
      const data = await response.json();

      if (data.success) {
        // Filter out current user from results
        const filteredUsers = data.users.filter(
          (user: User) => user.username !== currentUsername
        );
        setSearchResults(filteredUsers);
      } else {
        setError(data.error || 'Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed. Please check your connection.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUsername]);

  // Effect to trigger search when query changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setError('');
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handleUserClick = async (user: User) => {
    if (selectedUser && selectedUser.username === user.username) {
      // User clicked the same user again, deselect
      setSelectedUser(null);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Fetch the user's public key
      const response = await fetch(`/api/users/${encodeURIComponent(user.username)}/publickey`);
      const data = await response.json();

      if (data.success) {
        const userWithKey: User = {
          username: data.username,
          publicKey: data.publicKey
        };

        setSelectedUser(userWithKey);

        if (onUserSelect) {
          onUserSelect(userWithKey);
        }
      } else {
        setError(data.error || 'Failed to get user information');
      }
    } catch (error) {
      console.error('User lookup error:', error);
      setError('Failed to get user information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setError('');
  };

  return (
    <div className="user-search-container">
      <div className="search-header">
        <h3>Find Users</h3>
        <p>Search for other users to start a secure chat</p>
      </div>

      <div className="search-input-container">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          disabled={isLoading}
          autoComplete="off"
        />
        {searchQuery && (
          <button 
            className="clear-search-button"
            onClick={handleClearSearch}
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Searching...</span>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="search-results">
          <h4>Search Results ({searchResults.length})</h4>
          <ul className="user-list">
            {searchResults.map((user) => (
              <li
                key={user.username}
                className={`user-item ${selectedUser?.username === user.username ? 'selected' : ''}`}
                onClick={() => handleUserClick(user)}
              >
                <div className="user-info">
                  <span className="username">@{user.username}</span>
                  {selectedUser?.username === user.username && (
                    <span className="selected-badge">Selected</span>
                  )}
                </div>
                <div className="user-actions">
                  <button className="select-button">
                    {selectedUser?.username === user.username ? 'Selected' : 'Select'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {searchQuery.trim().length >= 2 && searchResults.length === 0 && !isLoading && !error && (
        <div className="no-results">
          <p>No users found matching "{searchQuery}"</p>
          <small>Try a different search term</small>
        </div>
      )}

      {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
        <div className="search-hint">
          <p>Type at least 2 characters to search</p>
        </div>
      )}

      {selectedUser && (
        <div className="selected-user-info">
          <h4>Selected User</h4>
          <div className="selected-user-card">
            <div className="user-details">
              <span className="username">@{selectedUser.username}</span>
              <span className="status">Ready to chat</span>
            </div>
            <button 
              className="start-chat-button"
              onClick={() => onUserSelect && onUserSelect(selectedUser)}
              disabled={!selectedUser.publicKey}
            >
              Start Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};



export default UserSearch;