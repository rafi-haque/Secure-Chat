import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import DeliveryStatus from './DeliveryStatus';
import { encryptMessage, decryptMessage, importPublicKey } from '../lib/crypto';
import './ChatBubble.css';

interface Message {
  id: string;
  from: string;
  to: string;
  encryptedContent: string;
  decryptedContent?: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'failed';
}

interface ChatUser {
  username: string;
  publicKey: string;
}

interface TypingIndicator {
  username: string;
  isTyping: boolean;
}

interface ChatBubbleProps {
  currentUser: string;
  chatUser: ChatUser;
  privateKey?: CryptoKey;
  onClose: () => void;
  position: number; // Position index for stacking bubbles
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  currentUser, 
  chatUser, 
  privateKey,
  onClose,
  position
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const socketUrl = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl);
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      setError('');
      
      // Authenticate with server
      newSocket.emit('authenticate', { username: currentUser });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setError('Connection failed. Please check your connection.');
      setIsConnected(false);
    });

    // Handle authentication success
    newSocket.on('authenticated', (data: any) => {
      console.log('Authentication successful:', data);
      setError('');
    });

    // Handle authentication errors
    newSocket.on('authError', (data: any) => {
      console.error('Authentication error:', data);
      setError('Authentication failed: ' + data.error);
      setIsConnected(false);
    });

    // Handle incoming messages
    newSocket.on('message', async (data: any) => {
      try {
        // Only process messages from this specific chat user
        if (data.from !== chatUser.username) {
          return;
        }

        console.log('Received message:', { id: data.id, from: data.from, to: data.to });
        const message: Message = {
          id: data.id || Date.now().toString(),
          from: data.from,
          to: data.to,
          encryptedContent: data.content,
          timestamp: new Date(data.timestamp),
          status: 'delivered'
        };

        // Decrypt message if we have private key
        if (privateKey && data.content) {
          try {
            const decryptedContent = await decryptMessage(data.content, privateKey);
            message.decryptedContent = decryptedContent;
          } catch (decryptError) {
            console.error('Failed to decrypt message:', decryptError);
            message.decryptedContent = '[Unable to decrypt message]';
          }
        }

        setMessages(prev => [...prev, message]);
        
        // Increment unread count if minimized
        if (isMinimized) {
          setUnreadCount(prev => prev + 1);
        }
        
        // Send delivery confirmation
        newSocket.emit('messageReceived', {
          messageId: data.id,
          from: data.from
        });
      } catch (error) {
        console.error('Error handling incoming message:', error);
      }
    });

    // Handle message delivery confirmations
    newSocket.on('messageDelivered', (data: any) => {
      console.log('Message delivery status:', data);
      const status: 'delivered' | 'failed' = data.status === 'failed' ? 'failed' : 'delivered';
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, status }
          : msg
      ));
      
      if (data.status === 'failed') {
        setError(data.error || 'Message delivery failed');
      }
    });

    // Handle typing indicators
    newSocket.on('typing', (data: TypingIndicator) => {
      if (data.username === chatUser.username) {
        setOtherUserTyping(data.isTyping);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [currentUser, chatUser.username, privateKey, isMinimized]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom, isMinimized]);

  // Reset unread count when maximized
  useEffect(() => {
    if (!isMinimized) {
      setUnreadCount(0);
    }
  }, [isMinimized]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!socket || !isConnected) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', {
        to: chatUser.username,
        isTyping: true
      });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', {
        to: chatUser.username,
        isTyping: false
      });
    }, 1000);
  }, [socket, isConnected, chatUser.username, isTyping]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !socket || !isConnected || isSending) {
      return;
    }

    if (!chatUser.publicKey) {
      setError('Cannot send message: recipient public key not available');
      return;
    }

    setIsSending(true);
    setError('');

    const messageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    try {
      // Import recipient's public key
      const publicKey = await importPublicKey(chatUser.publicKey);
      
      // Encrypt message
      const encryptedContent = await encryptMessage(newMessage.trim(), publicKey);
      
      const message: Message = {
        id: messageId,
        from: currentUser,
        to: chatUser.username,
        encryptedContent,
        decryptedContent: newMessage.trim(),
        timestamp: new Date(),
        status: 'sending'
      };

      // Add message to local state
      setMessages(prev => [...prev, message]);
      
      // Send to server
      console.log('Sending message:', { id: messageId, to: chatUser.username, length: encryptedContent.length });
      socket.emit('sendMessage', {
        id: messageId,
        to: chatUser.username,
        encryptedContent: encryptedContent,
        timestamp: Date.now()
      });

      // Clear input
      setNewMessage('');
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        socket.emit('typing', {
          to: chatUser.username,
          isTyping: false
        });
      }

      // Update message status to sent
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: 'sent' as const }
            : msg
        ));
      }, 100);

    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
      
      // Update message status to failed
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press in input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 60000) { // Less than 1 minute
      return 'now';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
      return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div 
      className={`chat-bubble ${isMinimized ? 'minimized' : 'maximized'}`}
      style={{
        right: `${20 + (position * 340)}px`,
        bottom: '20px'
      }}
    >
      <div className="chat-bubble-header" onClick={toggleMinimize}>
        <div className="chat-bubble-user-info">
          <div className="chat-bubble-avatar">
            {chatUser.username.charAt(0).toUpperCase()}
          </div>
          <div className="chat-bubble-details">
            <h4>@{chatUser.username}</h4>
            <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '● Online' : '○ Offline'}
            </div>
          </div>
        </div>
        <div className="chat-bubble-actions">
          {unreadCount > 0 && isMinimized && (
            <span className="unread-badge">{unreadCount}</span>
          )}
          <button 
            className="minimize-button" 
            onClick={(e) => {
              e.stopPropagation();
              toggleMinimize();
            }}
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          <button 
            className="close-button" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {error && (
            <div className="error-banner">
              {error}
              <button onClick={() => setError('')}>✕</button>
            </div>
          )}

          <div className="chat-bubble-messages">
            <div className="messages-list">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <p>Start your secure conversation</p>
                  <small>Messages are end-to-end encrypted</small>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.from === currentUser ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      <div className="message-text">
                        {message.decryptedContent || '[Encrypted]'}
                      </div>
                      <div className="message-meta">
                        <span className="timestamp">
                          {formatTimestamp(message.timestamp)}
                        </span>
                        {message.from === currentUser && (
                          <DeliveryStatus status={message.status} />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {otherUserTyping && (
                <div className="typing-indicator">
                  <div className="typing-content">
                    <span>typing</span>
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="chat-bubble-input">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={`Message @${chatUser.username}...`}
              disabled={!isConnected || isSending}
              maxLength={1000}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || !isConnected || isSending}
              className="send-button"
            >
              {isSending ? '⏳' : '➤'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBubble;
