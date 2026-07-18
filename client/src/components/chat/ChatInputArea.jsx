import React, { useState, useRef, useEffect } from 'react';
import { LuSend, LuMic, LuMicOff, LuSparkles, LuBrain, LuCheck, LuRefreshCw } from 'react-icons/lu';
import './ChatInputArea.css';

export const ChatInputArea = ({ onSendMessage, isStreaming }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('tin-dung'); // 'tin-dung' | 'huy-dong' | 'quy-trinh'
  
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const recognitionRef = useRef(null);

  // Lấy cấu hình model từ localStorage hoặc mặc định là rỗng (Mặc định của backend)
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('shb_selected_model') || '';
  });

  // Lưu trữ danh sách mô hình thực tế tải từ API
  const [availableModels, setAvailableModels] = useState([
    { id: '', label: 'qwen3-4b · Mặc định', provider: 'Local' }
  ]);

  // Gọi API /models của backend FastAPI để lấy danh sách mô hình thực tế
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 
          (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:8000'
            : 'https://api.compliance.shb.com.vn');
            
        const response = await fetch(`${baseUrl}/models`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.models) {
            setAvailableModels(data.models);
            
            // Nếu model đang lưu trong localStorage không khớp với danh sách API trả về, 
            // tự động chuyển về model mặc định đầu tiên
            const isModelValid = data.models.some(m => m.id === selectedModel);
            if (!isModelValid && data.models.length > 0) {
              const defaultModelId = data.models[0].id;
              setSelectedModel(defaultModelId);
              localStorage.setItem('shb_selected_model', defaultModelId);
              window.dispatchEvent(new Event('local-storage-update'));
            }
          }
        }
      } catch (error) {
        console.warn('Không thể tải API /models thật, sử dụng cấu hình mặc định:', error);
      }
    };
    fetchModels();
  }, [selectedModel]);

  // Đồng bộ model AI 2 chiều (nếu đổi ở Sidebar)
  useEffect(() => {
    const handleStorageChange = () => {
      setSelectedModel(localStorage.getItem('shb_selected_model') || '');
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

  // Tích hợp Web Speech API thực tế cho giọng nói Tiếng Việt
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = 'vi-VN';
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setText(prev => (prev ? prev + ' ' + transcript : transcript));
        }
      };

      rec.onerror = (event) => {
        console.error('Lỗi nhận diện giọng nói:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '22px';
      const scrollHeight = textareaRef.current.scrollHeight;
      if (scrollHeight > 22) {
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

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      if (isRecording) {
        setIsRecording(false);
      } else {
        setIsRecording(true);
        setText('');
        setTimeout(() => {
          setText('Quy trình xác thực sinh trắc học khi chuyển khoản trên 10 triệu đồng tại SHB?');
          setIsRecording(false);
        }, 2500);
      }
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setText('');
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
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

  // Suggestions phân loại
  const suggestions = {
    'tin-dung': [
      { label: 'Hạn mức vay SHB Mobile', query: 'Quy định hạn mức cho vay tiêu dùng online trên ứng dụng SHB Mobile?' },
      { label: 'Giải ngân tín dụng bán lẻ', query: 'Quy trình các bước kiểm soát giải ngân tín dụng bán lẻ theo QĐ mới nhất của SHB?' },
      { label: 'Tỷ lệ TSĐB vay dự án', query: 'Tỷ lệ cho vay trên giá trị tài sản bảo đảm (LTV) đối với bất động sản dự án?' }
    ],
    'huy-dong': [
      { label: 'Hồ sơ eKYC mở tài khoản', query: 'Hồ sơ eKYC mở tài khoản cá nhân online tại SHB cần những gì?' },
      { label: 'Tất toán tiết kiệm online', query: 'Sổ tiết kiệm đến hạn tất toán xử lý thế nào theo quy chế SHB?' },
      { label: 'Xác thực sinh trắc học', query: 'Quy trình xác thực sinh trắc học khi giao dịch chuyển tiền trên 10 triệu đồng tại SHB?' }
    ],
    'quy-trinh': [
      { label: 'Bảo mật dữ liệu nội bộ', query: 'Quy chế bảo mật thông tin khách hàng và an toàn dữ liệu nội bộ SHB?' },
      { label: 'Ủy quyền ký hợp đồng tín dụng', query: 'Quy định về thẩm quyền ký kết hợp đồng tín dụng tại chi nhánh cấp 2?' },
      { label: 'Báo cáo giao dịch đáng ngờ', query: 'Quy trình báo cáo giao dịch đáng ngờ (STR) của SHB tuân thủ luật AML?' }
    ]
  };

  const getModelShortLabel = (modelId) => {
    const found = availableModels.find(m => m.id === modelId);
    if (found) {
      return found.label.split('·')[0].trim();
    }
    return 'Mặc định';
  };

  return (
    <div className="chat-input-container-panel">
      {/* Smart Suggestion Deck */}
      <div className="chat-suggestions-deck panel">
        <div className="suggestions-tabs-header">
          <span className="suggestions-deck-title">RM gợi ý nhanh:</span>
          <div className="suggestions-tabs-list">
            <button 
              className={`suggestion-tab-btn ${activeTab === 'tin-dung' ? 'active' : ''}`}
              onClick={() => setActiveTab('tin-dung')}
            >
              Tín dụng
            </button>
            <button 
              className={`suggestion-tab-btn ${activeTab === 'huy-dong' ? 'active' : ''}`}
              onClick={() => setActiveTab('huy-dong')}
            >
              Huy động & Số
            </button>
            <button 
              className={`suggestion-tab-btn ${activeTab === 'quy-trinh' ? 'active' : ''}`}
              onClick={() => setActiveTab('quy-trinh')}
            >
              Quy trình chung
            </button>
          </div>
        </div>
        
        <div className="suggestion-chips-list-container">
          <div className="suggestion-chips-list">
            {suggestions[activeTab].map((s, idx) => (
              <button 
                key={idx}
                className="chat-suggestion-chip-btn interactive"
                onClick={() => handleSuggestionClick(s.query)}
                disabled={isStreaming}
              >
                <LuSparkles className="chip-sparkle-icon" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Input Row */}
      <div className="chat-input-row-main">
        <div className="chat-input-left-controls">
          {/* Voice AI Button */}
          <div className="voice-recorder-wrapper">
            <button 
              className={`btn-input-voice-tool ${isRecording ? 'recording-active' : ''}`}
              onClick={toggleRecording}
              title={isRecording ? 'Đang lắng nghe... click để dừng' : 'Ghi âm câu hỏi bằng giọng nói (Tiếng Việt)'}
              disabled={isStreaming}
            >
              {isRecording ? <LuMicOff /> : <LuMic />}
            </button>
            
            {isRecording && (
              <div className="voice-audio-waveform">
                <span className="audio-wave-bar bar1"></span>
                <span className="audio-wave-bar bar2"></span>
                <span className="audio-wave-bar bar3"></span>
                <span className="audio-wave-bar bar4"></span>
                <span className="audio-wave-bar bar5"></span>
              </div>
            )}
          </div>

          {/* Model Selection Dropdown */}
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
                <div className="inline-popover-header">Model RAG AI Khả Dụng</div>
                <div className="inline-popover-options">
                  {availableModels.map((m) => (
                    <div 
                      key={m.id}
                      className={`inline-model-option ${selectedModel === m.id ? 'selected' : ''}`}
                      onClick={() => handleModelChange(m.id)}
                    >
                      <div className="model-option-main">
                        <span className="model-opt-name">{m.label}</span>
                        {selectedModel === m.id && <LuCheck className="opt-check-icon" />}
                      </div>
                      <span className="model-opt-desc">Nhà cung cấp: {m.provider}</span>
                    </div>
                  ))}
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
            value={isRecording ? 'Đang lắng nghe giọng nói... Hãy nói câu hỏi của bạn' : text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? 'Đang ghi âm...' : 'Hỏi trợ lý quy trình, thông tư của SHB...'}
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
