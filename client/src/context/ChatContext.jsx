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

  // Giả lập hiệu ứng streaming chữ nhận từ backend làm dự phòng
  const streamTextFallback = useCallback((text, responseData, callback) => {
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

  // Gửi câu hỏi lên API thật, tích hợp streaming SSE
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
    setIsStreaming(true);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 
        (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? 'http://localhost:8000'
          : 'https://api.compliance.shb.com.vn');

      // Lấy lịch sử hội thoại gần nhất để gửi lên model
      const apiMessages = chatHistory
        .filter(m => !m.isWelcome)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));
      apiMessages.push({ role: 'user', content: queryText });

      // Lọc và bảo vệ model ID gửi đi khớp CSDL thật (bỏ qua các cache model cũ)
      const selectedModel = localStorage.getItem('shb_selected_model') || '';
      let modelToSend = selectedModel;
      if (modelToSend === 'shb-core' || modelToSend === 'gemini-pro' || modelToSend === 'gemini-flash') {
        modelToSend = ''; // Chuyển về mặc định của Backend thật
      }

      // 2. Gọi API streaming thật của FastAPI
      const response = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: modelToSend,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      // Tạo tin nhắn AI trống ban đầu
      const aiMessageId = 'msg_' + Date.now();
      setChatHistory(prev => [
        ...prev,
        {
          id: aiMessageId,
          sender: 'ai',
          text: '',
          citations: [],
          has_conflict: false,
          actionable_draft: null,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      let buffer = '';
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Giữ lại phần dòng chưa hoàn chỉnh cuối cùng trong buffer
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine.startsWith('data: ')) continue;
          
          const rawData = cleanLine.slice(6);
          if (rawData === '[DONE]') {
            setIsStreaming(false);
            continue;
          }
          
          try {
            const event = JSON.parse(rawData);
            
            // Xử lý các bước dữ liệu từ backend FastAPI
            if (event.step === 'answer') {
              if (event.status === 'streaming') {
                const chunk = event.data.chunk || '';
                fullText += chunk;
                setChatHistory(prev => prev.map(msg => 
                  msg.id === aiMessageId ? { ...msg, text: fullText } : msg
                ));
              } else if (event.status === 'done') {
                const finalData = event.data || {};
                const text = finalData.text || fullText;
                
                // Trích lục citations từ Object map sang Array bằng thông tin chi tiết động từ metadata
                const citationMap = finalData.citations || {};
                const citationsList = Object.entries(citationMap).map(([key, value]) => {
                  const metadata = value?.metadata || {};
                  const docNum = metadata.doc_num || '';
                  const article = metadata.article || '';
                  const clause = metadata.clause || '';
                  
                  // Tạo nhãn dạng: "SHB-eKYC-2023 - Điều B2" hoặc fallback
                  let label = metadata.title || `Tài liệu [${key}]`;
                  if (docNum) {
                    label = `${docNum} - ${article} ${clause}`.trim();
                  }
                  
                  return {
                    id: value?.chunk_id || value?.id || key,
                    label: label,
                    sourceText: value?.content || value?.text || ''
                  };
                });
                
                // Phát hiện mâu thuẫn
                const hasConflict = finalData.conflict_status === 'conflict_detected' || (finalData.conflicts && finalData.conflicts.length > 0);
                
                // Sinh bản nháp hành động
                let actionableDraft = null;
                if (finalData.conflicts && finalData.conflicts.length > 0) {
                  actionableDraft = {
                    type: "email",
                    content: `Kính gửi Bộ phận Quản lý Tuân thủ SHB,\n\nTôi muốn báo cáo một điểm mâu thuẫn pháp quy chéo vừa phát hiện trong hệ thống:\n- Nội dung mâu thuẫn: ${finalData.conflicts.map(c => c.description || c.title || '').join('\n')}\n- Khuyến nghị hành động: Đề xuất rà soát sửa đổi quy chế nội bộ liên quan để đảm bảo tuân thủ đúng quy định tối đa của Ngân hàng Nhà nước.\n\nTrân trọng,\nRM Khối Bán lẻ SHB`
                  };
                } else {
                  actionableDraft = {
                    type: "crm",
                    content: `Đồng bộ CRM SHB: Ghi nhận yêu cầu tra cứu của RM về chủ đề pháp quy. Đã phản hồi đúng quy chuẩn và không phát hiện vi phạm tuân thủ.`
                  };
                }

                setChatHistory(prev => prev.map(msg => 
                  msg.id === aiMessageId ? { 
                    ...msg, 
                    text: text,
                    citations: citationsList,
                    has_conflict: hasConflict,
                    actionable_draft: actionableDraft
                  } : msg
                ));
                setIsStreaming(false);
              }
            } else if (event.step === 'context_ready') {
              // Nhận trước danh sách citations để hiển thị nhanh trên UI
              const finalData = event.data || {};
              const citationMap = finalData.citations || {};
              const citationsList = Object.entries(citationMap).map(([key, value]) => {
                const metadata = value?.metadata || {};
                const docNum = metadata.doc_num || '';
                const article = metadata.article || '';
                const clause = metadata.clause || '';
                
                // Tạo nhãn dạng: "SHB-eKYC-2023 - Điều B2" hoặc fallback
                let label = metadata.title || `Tài liệu [${key}]`;
                if (docNum) {
                  label = `${docNum} - ${article} ${clause}`.trim();
                }
                
                return {
                  id: value?.chunk_id || value?.id || key,
                  label: label,
                  sourceText: value?.content || value?.text || ''
                };
              });
              setChatHistory(prev => prev.map(msg => 
                msg.id === aiMessageId ? { 
                  ...msg, 
                  citations: citationsList
                } : msg
              ));
            }
          } catch (e) {
            console.error('Lỗi parse JSON stream:', e);
          }
        }
      }
      setIsStreaming(false);
    } catch (error) {
      console.warn('Lỗi kết nối API thật, kích hoạt cơ chế tự động fallback Mock data.', error);
      
      // 3. Fallback sang xử lý Mock data như cũ
      const normalizedQuery = queryText
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

      let matchedKey = 'kyc_docs';
      if (normalizedQuery.includes('vay') || normalizedQuery.includes('tin chap') || normalizedQuery.includes('han muc') || normalizedQuery.includes('loan')) {
        matchedKey = 'loan_limit';
      } else if (normalizedQuery.includes('tiet kiem') || normalizedQuery.includes('dao han') || normalizedQuery.includes('gia han') || normalizedQuery.includes('deposit')) {
        matchedKey = 'deposit_renewal';
      }

      const mockResponse = mockChatResponse[matchedKey];
      setTimeout(() => {
        streamTextFallback(mockResponse.answer, mockResponse);
      }, 1000);
    }

  }, [chatHistory, isStreaming, streamTextFallback]);

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
