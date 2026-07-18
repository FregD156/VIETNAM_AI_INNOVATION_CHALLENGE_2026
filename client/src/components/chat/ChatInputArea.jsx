import React, { useState, useRef, useEffect } from 'react';
import { LuSend, LuMic, LuMicOff, LuSparkles, LuBrain, LuCheck, LuRefreshCw } from 'react-icons/lu';
import './ChatInputArea.css';

export const ChatInputArea = ({ onSendMessage, isStreaming }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  // Lấy cấu hình model từ localStorage
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('shb_selected_model') || 'shb-core';
  });

  // Đồng bộ model AI 2 chiều (nếu đổi ở Sidebar)
  useEffect(() => {
    const handleStorageChange = () => {
      setSelectedModel(localStorage.getItem('shb_selected_model') || 'shb-core');
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleStorageChange);
    };
  }, []);

  // Đóng dropdown model khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowModelMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea mượt mà không bị chèn chữ
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '22px'; // Chiều cao mặc định 1 dòng
      const scrollHeight = textareaRef.current.scrollHeight;
      if (scrollHeight > 22) {
        // Tự động giãn nở nhưng khống chế max-height
        textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
      }
    }
  }, [text]);

  const handleSend = () => {
    if (!text.trim() || isStreaming) return;
    onSendMessage(text);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '22px';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Giả lập tính năng Voice Agent
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setText('Hồ sơ eKYC mở tài khoản cá nhân online tại SHB cần những gì?');
    } else {
      setIsRecording(true);
      setText('');
    }
  };

  const handleSuggestionClick = (query) => {
    if (isStreaming) return;
    onSendMessage(query);
  };

  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
    localStorage.setItem('shb_selected_model', modelId);
    window.dispatchEvent(new Event('local-storage-update'));
    setShowModelMenu(false);
  };

  const suggestions = [
    { label: 'Hồ sơ eKYC SHB', query: 'Hồ sơ eKYC mở tài khoản cá nhân online tại SHB cần những gì?' },
    { label: 'Hạn mức vay SHB Mobile', query: 'Quy định hạn mức cho vay tiêu dùng online trên ứng dụng SHB Mobile?' },
    { label: 'Tất toán tiết kiệm SHB', query: 'Sổ tiết kiệm đến hạn tất toán xử lý thế nào theo quy chế SHB?' }
  ];

  const getModelShortLabel = (modelId) => {
    switch (modelId) {
      case 'shb-core': return 'Core-v2';
      case 'gemini-pro': return 'G-Pro';
      case 'gemini-flash': return 'G-Flash';
      default: return 'Core-v2';
    }
  };

  return (
    <div className="chat-input-container-panel">
      {/* Suggestion Chips (Gợi ý hỏi nhanh) */}
      <div className="chat-suggestions-wrapper">
        <span className="suggestions-intro-label">RM hỏi nhanh:</span>
        <div className="suggestion-chips-list">
          {suggestions.map((s, idx) => (
            <button 
              key={idx}
              className="chat-suggestion-chip-btn"
              onClick={() => handleSuggestionClick(s.query)}
              disabled={isStreaming}
            >
              <LuSparkles className="chip-sparkle-icon" />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Input Row */}
      <div className="chat-input-row-main">
        <div className="chat-input-left-controls">
          {/* Voice AI Button */}
          <button 
            className={`btn-input-voice-tool ${isRecording ? 'recording-active' : ''}`}
            onClick={toggleRecording}
            title={isRecording ? 'Đang ghi âm... click để dừng' : 'Ghi âm câu hỏi (FPT Voice AI)'}
            disabled={isStreaming}
          >
            {isRecording ? <LuMicOff /> : <LuMic />}
          </button>

          {/* Model Selection Dropdown (Cạnh khung chat) */}
          <div className="chat-model-selector-inline" ref={dropdownRef}>
            <button 
              className={`btn-chat-model-selector-trigger ${showModelMenu ? 'active' : ''}`}
              onClick={() => setShowModelMenu(!showModelMenu)}
              disabled={isStreaming}
              title="Chọn Model RAG AI"
            >
              <LuBrain className="model-selector-icon" />
              <span className="model-selector-label-text monospace">
                {getModelShortLabel(selectedModel)}
              </span>
            </button>

            {showModelMenu && (
              <div className="chat-model-inline-popover panel signature-reveal">
                <div className="inline-popover-header">Model RAG AI</div>
                <div className="inline-popover-options">
                  <div 
                    className={`inline-model-option ${selectedModel === 'shb-core' ? 'selected' : ''}`}
                    onClick={() => handleModelChange('shb-core')}
                  >
                    <div className="model-option-main">
                      <span className="model-opt-name">SHB Core RAG-v2</span>
                      {selectedModel === 'shb-core' && <LuCheck className="opt-check-icon" />}
                    </div>
                    <span className="model-opt-desc">Quy trình & quy chế nội bộ SHB</span>
                  </div>

                  <div 
                    className={`inline-model-option ${selectedModel === 'gemini-pro' ? 'selected' : ''}`}
                    onClick={() => handleModelChange('gemini-pro')}
                  >
                    <div className="model-option-main">
                      <span className="model-opt-name">Gemini 1.5 Pro</span>
                      {selectedModel === 'gemini-pro' && <LuCheck className="opt-check-icon" />}
                    </div>
                    <span className="model-opt-desc">Lập luận phức tạp, xung đột luật chéo</span>
                  </div>

                  <div 
                    className={`inline-model-option ${selectedModel === 'gemini-flash' ? 'selected' : ''}`}
                    onClick={() => handleModelChange('gemini-flash')}
                  >
                    <div className="model-option-main">
                      <span className="model-opt-name">Gemini 1.5 Flash</span>
                      {selectedModel === 'gemini-flash' && <LuCheck className="opt-check-icon" />}
                    </div>
                    <span className="model-opt-desc">Tốc độ cao, tóm tắt nhanh văn bản</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Textarea Input Box */}
        <div className="chat-textarea-box-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-textarea-control"
            rows={1}
            value={isRecording ? 'Đang lắng nghe giọng nói... Nói ngay bây giờ' : text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tra cứu quy trình, thông tư..."
            disabled={isStreaming || isRecording}
          />
        </div>

        {/* Send Button */}
        <button 
          className="btn-chat-send-submit"
          onClick={handleSend}
          disabled={(!text.trim() && !isRecording) || isStreaming}
          title="Gửi câu hỏi (Enter)"
        >
          {isStreaming ? <LuRefreshCw className="send-icon-loading" /> : <LuSend />}
        </button>
      </div>

      {/* Smart status labels in footer */}
      <div className="chat-input-footer-labels">
        <div className="footer-label-item">
          {/* Đã bỏ icon onl chấm nháy xanh ở đây */}
          <span className="footer-label-text">Tiếng Việt Tự Động Chuẩn Hóa RAG</span>
        </div>
        <div className="footer-label-item">
          <LuSparkles className="footer-label-sparkle glow-orange-icon" />
          <span className="footer-label-text monospace text-highlight">FPT AI Factory Rerank v2</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInputArea;
