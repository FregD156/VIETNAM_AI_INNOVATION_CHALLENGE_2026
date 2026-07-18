import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import './ChatHistoryList.css';

export const ChatHistoryList = ({ chatHistory, onCitationClick }) => {
  const listRef = useRef(null);

  // Tự động cuộn xuống cuối danh sách khi có tin nhắn mới hoặc streaming text
  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  return (
    <div className="chat-history-list" ref={listRef}>
      {chatHistory.map((message) => (
        <MessageItem 
          key={message.id} 
          message={message} 
          onCitationClick={onCitationClick}
        />
      ))}
    </div>
  );
};

export default ChatHistoryList;
