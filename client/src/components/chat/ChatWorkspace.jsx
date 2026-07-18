import React, { useState } from 'react';
import { LuSparkles } from 'react-icons/lu';
import { useChatStream } from '../../hooks/useChatStream';
import ChatHistoryList from './ChatHistoryList';
import ChatInputArea from './ChatInputArea';
import CitationModal from './CitationModal';
import './ChatWorkspace.css';

export const ChatWorkspace = () => {
  const { chatHistory, isStreaming, sendMessage, clearChat } = useChatStream();
  const [activeCitationId, setActiveCitationId] = useState(null);

  const handleCitationClick = (citationId) => {
    setActiveCitationId(citationId);
  };

  const handleCloseModal = () => {
    setActiveCitationId(null);
  };

  return (
    <div className="chat-workspace">
      {/* Workspace Header */}
      <header className="workspace-header">
        <div className="workspace-title">
          <LuSparkles />
          <span>AI Assistant - Tra cứu Pháp quy SHB</span>
        </div>
        <div className="workspace-badge">
          Hệ thống eKYC & Tín dụng
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
        onClearChat={clearChat}
        isStreaming={isStreaming}
      />

      {/* Citation Modal Popup (Lazy Loaded) */}
      {activeCitationId && (
        <CitationModal 
          citationId={activeCitationId} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

export default ChatWorkspace;
