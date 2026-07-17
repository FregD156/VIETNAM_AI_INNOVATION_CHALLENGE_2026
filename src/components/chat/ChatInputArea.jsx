import React, { useState, useRef, useEffect } from 'react';
import { LuSend, LuTrash2, LuMic, LuMicOff, LuSparkles } from 'react-icons/lu';
import './ChatInputArea.css';

export const ChatInputArea = ({ onSendMessage, onClearChat, isStreaming }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef(null);

  // Auto-resize textarea dựa trên lượng text nhập vào
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight - 16}px`;
    }
  }, [text]);

  const handleSend = () => {
    if (!text.trim() || isStreaming) return;
    onSendMessage(text);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Giả lập tính năng Voice Agent (Speech-to-Text) trong đề xuất FPT giải phụ
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Điền câu hỏi giả lập khi ngắt ghi âm
      setText('Hồ sơ eKYC mở tài khoản cá nhân online cần những gì?');
    } else {
      setIsRecording(true);
    }
  };

  const handleSuggestionClick = (query) => {
    if (isStreaming) return;
    onSendMessage(query);
  };

  const suggestions = [
    { label: 'Hồ sơ eKYC online', query: 'Hồ sơ eKYC mở tài khoản cá nhân online cần những gì?' },
    { label: 'Hạn mức vay tín chấp', query: 'Quy định hạn mức vay tín chấp tiêu dùng online?' },
    { label: 'Gia hạn sổ tiết kiệm', query: 'Sổ tiết kiệm đến hạn tất toán xử lý thế nào?' }
  ];

  return (
    <div className="chat-input-area">
      {/* Suggestion Chips */}
      <div className="suggestion-chips">
        {suggestions.map((s, idx) => (
          <button 
            key={idx}
            className="suggestion-chip"
            onClick={() => handleSuggestionClick(s.query)}
            disabled={isStreaming}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="input-row">
        {/* Nút xóa lịch sử chat */}
        <button 
          className="btn-input-icon" 
          onClick={onClearChat}
          title="Xóa lịch sử chat"
          disabled={isStreaming}
        >
          <LuTrash2 size={16} />
        </button>

        {/* Khung nhập text */}
        <div className="input-container">
          <textarea
            ref={textareaRef}
            className="chat-input"
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tra cứu quy trình, thông tư hoặc điều khoản tại đây..."
            disabled={isStreaming}
          />
          
          <div className="input-actions">
            {/* Giả lập Voice Agent */}
            <button 
              className={`btn-input-icon ${isRecording ? 'recording animate-pulse-red' : ''}`}
              onClick={toggleRecording}
              title={isRecording ? 'Đang lắng nghe... click để dừng' : 'Ghi âm câu hỏi (FPT Voice AI)'}
              disabled={isStreaming}
            >
              {isRecording ? <LuMicOff size={16} /> : <LuMic size={16} />}
            </button>
          </div>
        </div>

        {/* Nút Gửi */}
        <button 
          className="btn-send"
          onClick={handleSend}
          disabled={!text.trim() || isStreaming}
        >
          <LuSend size={16} />
        </button>
      </div>

      <div className="input-footer">
        <div className="status-info">
          <span className="status-dot"></span>
          <span>Hỗ trợ tiếng Việt tự động điền dấu</span>
        </div>
        <div className="status-info">
          <LuSparkles />
          <span>FPT AI Factory Rerank Enabled</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInputArea;
