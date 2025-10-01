import React from 'react';
import ChatBubble from './ChatBubble';

interface ChatUser {
  username: string;
  publicKey: string;
}

interface ActiveChat {
  user: ChatUser;
  id: string;
}

interface ChatManagerProps {
  currentUser: string;
  privateKey?: CryptoKey;
  activeChats: ActiveChat[];
  onCloseChat: (chatId: string) => void;
}

const ChatManager: React.FC<ChatManagerProps> = ({
  currentUser,
  privateKey,
  activeChats,
  onCloseChat
}) => {
  return (
    <>
      {activeChats.map((chat, index) => (
        <ChatBubble
          key={chat.id}
          currentUser={currentUser}
          chatUser={chat.user}
          privateKey={privateKey}
          onClose={() => onCloseChat(chat.id)}
          position={index}
        />
      ))}
    </>
  );
};

export default ChatManager;
