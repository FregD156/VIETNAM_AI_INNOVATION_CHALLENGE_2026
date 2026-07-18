import React, { useState, useEffect } from 'react';
import { LuSparkles, LuTrash2, LuActivity, LuBrain } from 'react-icons/lu';
import { useChatStream } from '../../hooks/useChatStream';
import ChatHistoryList from './ChatHistoryList';
import ChatInputArea from './ChatInputArea';
import CitationModal from './CitationModal';
import './ChatWorkspace.css';

export const ChatWorkspace = () => {
  const { chatHistory, isStreaming, sendMessage, clearChat } = useChatStream();
  const [activeCitationId, setActiveCitationId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false); // Modal xác nhận xóa
  
  // Trạng thái đồng bộ mô hình AI được chọn từ Sidebar
  const [currentModel, setCurrentModel] = useState(() => {
    return localStorage.getItem('shb_selected_model') || 'shb-core';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentModel(localStorage.getItem('shb_selected_model') || 'shb-core');
    };
    
    // Lắng nghe sự kiện lưu trữ cục bộ khi thay đổi model bên Sidebar
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleStorageChange);
    
    // Tự động kiểm tra định kỳ để đồng bộ tốt hơn
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleCitationClick = (citationId) => {
    setActiveCitationId(citationId);
  };

  const handleCloseModal = () => {
    setActiveCitationId(null);
  };

  const handleClearChatClick = () => {
    setShowConfirmModal(true);
  };

  const executeClearChat = () => {
    clearChat();
    setShowConfirmModal(false);
  };

  const getModelName = (modelId) => {
    switch (modelId) {
      case 'shb-core': return 'SHB Core RAG-v2';
      case 'gemini-pro': return 'Gemini 1.5 Pro';
      case 'gemini-flash': return 'Gemini 1.5 Flash';
      default: return 'SHB Core RAG-v2';
    }
  };

  return (
    <div className="chat-workspace">
      {/* Dynamic & Professional Header */}
      <header className="chat-workspace-header">
        <div className="header-left-group">
          <div className="bot-avatar-header">
            <LuSparkles />
          </div>
          <div className="title-container">
            <h1 className="chat-main-title">AI Assistant - Tra cứu Pháp quy</h1>
            <p className="chat-sub-title">Trợ lý hỗ trợ RM khối Bán lẻ & Tín dụng SHB</p>
          </div>
        </div>

        <div className="header-right-group">
          <div className="header-status-badge">
            <LuBrain className="badge-icon" />
            <span className="badge-text monospace">{getModelName(currentModel)}</span>
          </div>
          <div className="header-status-badge status-latency">
            <LuActivity className="badge-icon glow-blue" />
            <span className="badge-text monospace text-muted">Latency: ~42ms</span>
          </div>
          
          <button 
            className="btn-header-action" 
            onClick={handleClearChatClick}
            disabled={isStreaming}
            title="Dọn dẹp phiên hội thoại"
          >
            <LuTrash2 />
            <span>Xóa Chat</span>
          </button>
        </div>
      </header>

      {/* Message History List */}
      <ChatHistoryList 
        chatHistory={chatHistory} 
        onCitationClick={handleCitationClick} 
      />

      {/* Input controls */}
      <ChatInputArea 
        onSendMessage={sendMessage} 
        isStreaming={isStreaming}
      />

      {/* Citation Modal Popup (Lazy Loaded) */}
      {activeCitationId && (
        <CitationModal 
          citationId={activeCitationId} 
          onClose={handleCloseModal} 
        />
      )}

      {/* Confirm Modal Overlay */}
      {showConfirmModal && (
        <div className="confirm-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="confirm-modal-box panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-modal-title">Xác nhận xóa lịch sử</h3>
            <p className="confirm-modal-text">Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện hiện tại không? Hành động này không thể hoàn tác.</p>
            <div className="confirm-modal-actions">
              <button className="btn-confirm-cancel" onClick={() => setShowConfirmModal(false)}>Hủy</button>
              <button className="btn-confirm-delete" onClick={executeClearChat}>Xác nhận xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWorkspace;
