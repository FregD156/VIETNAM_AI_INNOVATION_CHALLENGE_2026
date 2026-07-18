import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import './ChatHistoryList.css';

export const ChatHistoryList = ({ chatHistory, onCitationClick }) => {
  const listRef = useRef(null);
  const wasAtBottomRef = useRef(true); // Cờ lưu trạng thái người dùng có đang ở đáy hay không

  // Theo dõi vị trí cuộn của người dùng
  const handleScroll = () => {
    if (listRef.current) {
      const container = listRef.current;
      // Kiểm tra xem khoảng cách tới đáy có nhỏ hơn 150px không
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      wasAtBottomRef.current = atBottom;
    }
  };

  // Tự động cuộn xuống cuối danh sách khi có tin nhắn mới hoặc streaming text
  useEffect(() => {
    if (listRef.current) {
      const container = listRef.current;
      const lastMessage = chatHistory[chatHistory.length - 1];
      const isUserLastMessage = lastMessage && lastMessage.sender === 'user';
      
      // Chỉ cuộn xuống đáy nếu trước đó người dùng đang ở đáy, hoặc tin nhắn cuối cùng là do user gửi
      if (wasAtBottomRef.current || isUserLastMessage) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [chatHistory]);

  return (
    <div 
      className="chat-history-list" 
      ref={listRef}
      onScroll={handleScroll}
    >
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
