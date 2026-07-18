import React, { useState } from 'react';
import { 
  LuSparkles, 
  LuUser, 
  LuCopy, 
  LuCheck, 
  LuVolume2, 
  LuVolumeX, 
  LuThumbsUp, 
  LuThumbsDown,
  LuBookOpen,
  LuShieldCheck
} from 'react-icons/lu';
import CitationTag from './CitationTag';
import WarningCard from './WarningCard';
import ActionableDraft from './ActionableDraft';
import './MessageItem.css';

export const MessageItem = ({ message, onCitationClick }) => {
  const isAi = message.sender === 'ai';
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(null); // null | 'up' | 'down'
  const [isPlayingTTS, setIsPlayingTTS] = useState(false); // Giả lập giọng đọc TTS

  // Tính toán / lấy điểm phần trăm độ tin cậy RAG
  const getConfidenceScore = () => {
    if (message.confidence) return message.confidence;
    if (message.isWelcome) return null;
    
    // Giả lập thông minh dựa trên số lượng Citation nguồn dẫn chiếu
    const base = 91;
    const citCount = message.citations ? message.citations.length : 0;
    const lengthMod = message.text ? message.text.length % 5 : 0;
    const score = Math.min(99, base + (citCount * 2) + lengthMod);
    return score;
  };

  const confidenceScore = getConfidenceScore();

  // Sao chép câu trả lời vào clipboard
  const handleCopyText = () => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Giả lập phát giọng nói câu trả lời
  const toggleTTS = () => {
    setIsPlayingTTS(!isPlayingTTS);
  };

  // Nâng cấp parser Markdown đơn giản bằng JS thuần để render văn bản pháp quy đẹp mắt
  const parseText = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    let inList = false;
    let listItems = [];
    const elements = [];

    const parseBold = (str) => {
      const parts = str.split('**');
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          return <strong key={index}>{part}</strong>;
        }
        return part;
      });
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      // 1. Nhận diện tiêu đề h3 (### )
      if (trimmed.startsWith('### ')) {
        if (inList) {
          elements.push(<ul key={`ul_${idx}`}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(<h3 key={`h3_${idx}`} className="message-h3">{parseBold(trimmed.substring(4))}</h3>);
      }
      // 2. Nhận diện tiêu đề h2 (## )
      else if (trimmed.startsWith('## ')) {
        if (inList) {
          elements.push(<ul key={`ul_${idx}`}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(<h2 key={`h2_${idx}`} className="message-h2">{parseBold(trimmed.substring(3))}</h2>);
      }
      // 3. Nhận diện trích dẫn luật gốc (> )
      else if (trimmed.startsWith('> ')) {
        if (inList) {
          elements.push(<ul key={`ul_${idx}`}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(
          <blockquote key={`bq_${idx}`} className="message-blockquote animate-fade-in">
            <div className="blockquote-inner-wrapper">
              <span className="quote-mark-legal">“</span>
              <p className="quote-content-legal-text">{parseBold(trimmed.substring(2))}</p>
            </div>
          </blockquote>
        );
      }
      // 4. Nhận diện danh sách dạng dấu tròn (* hoặc -)
      else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        inList = true;
        listItems.push(<li key={`li_${idx}`}>{parseBold(trimmed.substring(2))}</li>);
      } 
      // 5. Nhận diện dòng trống tạo khoảng cách
      else if (trimmed === '') {
        if (inList) {
          elements.push(<ul key={`ul_${idx}`}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(<div key={`space_${idx}`} className="message-space" />);
      } 
      // 6. Đoạn văn thường
      else {
        if (inList) {
          elements.push(<ul key={`ul_${idx}`}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(<p key={`p_${idx}`} className="message-p">{parseBold(line)}</p>);
      }
    });

    if (inList) {
      elements.push(<ul key="ul_final">{listItems}</ul>);
    }

    return elements;
  };

  return (
    <div className={`message-item-row ${message.sender}`}>
      {/* Symmetrical Avatars */}
      {isAi && (
        <div className="message-avatar bot-avatar animate-fade-in" title="Trợ lý AI Pháp quy SHB">
          <LuSparkles />
        </div>
      )}

      <div className="message-bubble-wrapper-outer">
        <div className={`message-bubble-box ${message.isWelcome ? 'welcome' : ''}`}>
          {/* Header tin nhắn */}
          <div className="message-bubble-header">
            <span className="bubble-sender-name">
              {isAi ? 'Trợ lý AI Pháp quy SHB' : 'Cán bộ RM (Nguyễn Văn An)'}
            </span>
            <span className="bubble-message-time">{message.timestamp}</span>
          </div>

          {/* RAG Confidence Gauge (Thước đo độ tin cậy RAG) */}
          {isAi && confidenceScore && (
            <div className="rag-confidence-gauge-container animate-fade-in">
              <div className="gauge-meta">
                <div className="gauge-label-group">
                  <LuShieldCheck className={`gauge-shield-icon ${confidenceScore >= 90 ? 'high' : confidenceScore >= 75 ? 'medium' : 'low'}`} />
                  <span className="gauge-title-text">Độ tin cậy đối sánh RAG:</span>
                </div>
                <span className="gauge-percent-value monospace">{confidenceScore}%</span>
              </div>
              <div className="gauge-bar-track">
                <div 
                  className={`gauge-bar-fill ${confidenceScore >= 90 ? 'high' : confidenceScore >= 75 ? 'medium' : 'low'}`}
                  style={{ '--target-width': `${confidenceScore}%` }}
                />
              </div>
            </div>
          )}

          {/* Nội dung tin nhắn */}
          <div className="message-bubble-body">
            {parseText(message.text)}
            
            {/* Stream cursor nhấp nháy khi AI đang stream chữ */}
            {isAi && message.text === '' && <span className="stream-cursor" />}
          </div>

          {/* Cảnh báo xung đột pháp quy */}
          {isAi && message.has_conflict && <WarningCard />}

          {/* Bản nháp email / script đề xuất */}
          {isAi && message.actionable_draft && (
            <ActionableDraft draft={message.actionable_draft} />
          )}

          {/* Tags nguồn trích dẫn pháp lý */}
          {isAi && message.citations && message.citations.length > 0 && (
            <div className="message-bubble-citations">
              <span className="citations-header-label">
                <LuBookOpen className="citations-header-icon" />
                <span>Nguồn trích dẫn đối sánh:</span>
              </span>
              <div className="citations-tags-container">
                {message.citations.map((cit) => (
                  <CitationTag 
                    key={cit.id} 
                    id={cit.id} 
                    label={cit.label} 
                    onClick={onCitationClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Message Action Toolbar (Thanh công cụ phụ chuyên nghiệp dưới câu trả lời) */}
        {isAi && message.text !== '' && (
          <div className="message-action-toolbar animate-fade-in">
            <button className="msg-action-btn" onClick={handleCopyText} title="Sao chép câu trả lời">
              {copied ? <LuCheck className="success-green-icon" /> : <LuCopy />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
            
            <button 
              className={`msg-action-btn ${isPlayingTTS ? 'tts-playing' : ''}`} 
              onClick={toggleTTS} 
              title={isPlayingTTS ? 'Tắt giọng đọc' : 'Nghe trợ lý đọc câu trả lời (TTS)'}
            >
              {isPlayingTTS ? <LuVolumeX className="tts-playing-icon" /> : <LuVolume2 />}
              <span>{isPlayingTTS ? 'Đang đọc...' : 'Nghe câu trả lời'}</span>
            </button>

            <div className="msg-action-divider"></div>

            <button 
              className={`msg-action-feedback-btn ${liked === 'up' ? 'active-like' : ''}`}
              onClick={() => setLiked(liked === 'up' ? null : 'up')}
              title="Câu trả lời hữu ích"
            >
              <LuThumbsUp />
            </button>
            
            <button 
              className={`msg-action-feedback-btn ${liked === 'down' ? 'active-dislike' : ''}`}
              onClick={() => setLiked(liked === 'down' ? null : 'down')}
              title="Câu trả lời chưa chính xác"
            >
              <LuThumbsDown />
            </button>
          </div>
        )}
      </div>

      {!isAi && (
        <div className="message-avatar user-avatar animate-fade-in" title="RM Nguyễn Văn An">
          <LuUser />
        </div>
      )}
    </div>
  );
};

export default MessageItem;
