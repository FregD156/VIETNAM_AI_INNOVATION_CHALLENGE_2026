import React, { createContext, useContext, useState, useCallback } from 'react';
import mockChatResponse from '../mocks/mockChatResponse.json';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [chatHistory, setChatHistory] = useState([
    {
      id: 'msg_welcome',
      sender: 'ai',
      text: 'Xin chào! Tôi là **Trợ lý AI Pháp quy SHB**. Tôi được huấn luyện đặc biệt để hỗ trợ bạn tra cứu các văn bản pháp quy, quy định nội bộ và phát hiện mâu thuẫn luật. \n\nDưới đây là một số chủ đề gợi ý:',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      isWelcome: true
    }
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState('default');

  // Giả lập hiệu ứng streaming chữ nhận từ backend
  const streamText = useCallback((text, responseData, callback) => {
    setIsStreaming(true);
    let index = 0;
    const speed = 25; // ms per character
    
    // Tạo tin nhắn rỗng ban đầu để render streaming cursor
    const messageId = 'msg_' + Date.now();
    setChatHistory(prev => [
      ...prev,
      {
        id: messageId,
        sender: 'ai',
        text: '',
        citations: responseData.citations || [],
        has_conflict: responseData.has_conflict || false,
        actionable_draft: responseData.actionable_draft || null,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    const interval = setInterval(() => {
      if (index < text.length) {
        // Lấy ký tự hoặc từ
        const nextChar = text.slice(0, index + 1);
        setChatHistory(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, text: nextChar } : msg
        ));
        index += 3; // Stream nhanh hơn 3 ký tự một lần để đạt tốc độ tự nhiên
      } else {
        clearInterval(interval);
        setChatHistory(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, text: text } : msg
        ));
        setIsStreaming(false);
        if (callback) callback();
      }
    }, speed);
  }, []);

  const sendMessage = useCallback(async (queryText) => {
    if (!queryText.trim() || isStreaming) return;

    // 1. Thêm tin nhắn của User vào chat history
    const userMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatHistory(prev => [...prev, userMessage]);

    // 2. Phân tích nội dung thô (tiền xử lý chuẩn hóa ở client)
    const normalizedQuery = queryText
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu
      .trim();

    // Lựa chọn phản hồi từ mock data dựa trên từ khóa
    let matchedKey = 'kyc_docs'; // Mặc định
    if (normalizedQuery.includes('vay') || normalizedQuery.includes('tin chap') || normalizedQuery.includes('han muc') || normalizedQuery.includes('loan')) {
      matchedKey = 'loan_limit';
    } else if (normalizedQuery.includes('tiet kiem') || normalizedQuery.includes('dao han') || normalizedQuery.includes('gia han') || normalizedQuery.includes('deposit')) {
      matchedKey = 'deposit_renewal';
    }

    const mockResponse = mockChatResponse[matchedKey];

    // Giả lập thời gian suy nghĩ của AI (RAG search)
    setIsStreaming(true);
    
    setTimeout(() => {
      streamText(mockResponse.answer, mockResponse);
    }, 1000);

  }, [isStreaming, streamText]);

  const clearChat = useCallback(() => {
    setChatHistory([
      {
        id: 'msg_welcome',
        sender: 'ai',
        text: 'Lịch sử chat đã được xóa sạch. Tôi có thể giúp gì cho bạn trong nghiệp vụ pháp quy SHB hôm nay?',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isWelcome: true
      }
    ]);
  }, []);

  return (
    <ChatContext.Provider value={{
      chatHistory,
      isStreaming,
      activeConversationId,
      sendMessage,
      clearChat,
      setActiveConversationId
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
