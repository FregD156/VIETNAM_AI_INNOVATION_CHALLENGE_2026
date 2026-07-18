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
  LuBookOpen
} from 'react-icons/lu';
import CitationTag from './CitationTag';
import WarningCard from './WarningCard';
import './MessageItem.css';

export const MessageItem = ({ message, onCitationClick }) => {
  const isAi = message.sender === 'ai';
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(null); // null | 'up' | 'down'
  const [isPlayingTTS, setIsPlayingTTS] = useState(false); // Trạng thái phát âm thật

  // Dọn dẹp âm thanh khi component unmount
  React.useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Sao chép câu trả lời vào clipboard
  const handleCopyText = () => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Đọc to câu trả lời tiếng Việt bằng SpeechSynthesis của trình duyệt
  const toggleTTS = () => {
    if (!window.speechSynthesis) {
      // Fallback nếu trình duyệt không hỗ trợ TTS
      setIsPlayingTTS(!isPlayingTTS);
      return;
    }

    if (isPlayingTTS) {
      window.speechSynthesis.cancel();
      setIsPlayingTTS(false);
    } else {
      window.speechSynthesis.cancel();
      
      // Làm sạch markdown text để phát âm tự nhiên hơn
      const cleanText = message.text
        .replace(/\*\*+/g, '')
        .replace(/###\s+/g, '')
        .replace(/##\s+/g, '')
        .replace(/>\s+/g, '')
        .replace(/[-*]\s+/g, ', ');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.0; // Tốc độ đọc vừa phải
      
      // Cố gắng chọn giọng đọc tiếng Việt tốt nhất
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VI'));
      if (viVoice) {
        utterance.voice = viVoice;
      }

      utterance.onend = () => {
        setIsPlayingTTS(false);
      };

      utterance.onerror = (e) => {
        console.error('Lỗi phát giọng đọc:', e);
        setIsPlayingTTS(false);
      };

      setIsPlayingTTS(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Nâng cấp parser Markdown đơn giản bằng JS thuần để render văn bản pháp quy đẹp mắt
  const parseText = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    let inList = false;
    let listItems = [];
    let inOrderedList = false;
    let orderedListItems = [];
    const elements = [];

    const parseKeywords = (text) => {
      if (typeof text !== 'string') return text;

      // Regex 1: nhận diện Thông tư / Quyết định (ví dụ: TT 06/2023, QĐ 214/2022/QĐ-SHB)
      const docRegexStr = '\\b((?:TT|QĐ)\\s*\\d+\\/\\d+(?:\\/(?:TT-NHNN|QĐ-SHB|SHB))?)\\b';
      
      // Regex 2: nhận diện số tiền, hạn mức giao dịch (ví dụ: 500 triệu, 100.000.000 VNĐ)
      const moneyRegexStr = '\\b(\\d+(?:\\.\\d+)*\\s*(?:triệu|tỷ)(?:\\s*(?:đồng|VNĐ))?(?:\\/tháng)?|\\d{1,3}(?:\\.\\d{3})+(?:\\s*(?:VNĐ|đồng))?(?:\\/tháng)?)\\b';

      const combinedRegex = new RegExp(`${docRegexStr}|${moneyRegexStr}`, 'gi');
      
      const res = [];
      let lastIdx = 0;
      let match;
      let key = 0;
      
      while ((match = combinedRegex.exec(text)) !== null) {
        if (match.index > lastIdx) {
          res.push(text.substring(lastIdx, match.index));
        }
        
        const matchedText = match[0];
        if (matchedText.match(/(?:TT|QĐ)/i)) {
          res.push(
            <span key={`doc-${key++}`} className="legal-code-badge">
              {matchedText}
            </span>
          );
        } else {
          res.push(
            <span key={`money-${key++}`} className="legal-highlight">
              {matchedText}
            </span>
          );
        }
        
        lastIdx = combinedRegex.lastIndex;
      }
      
      if (lastIdx < text.length) {
        res.push(text.substring(lastIdx));
      }
      
      return res.length > 0 ? res : text;
    };

    const parseBold = (str) => {
      const parts = str.split('**');
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          return <strong key={index}>{parseKeywords(part)}</strong>;
        }
        return <span key={index}>{parseKeywords(part)}</span>;
      });
    };

    const closeListIfAny = (idx) => {
      if (inList) {
        elements.push(<ul key={`ul_${idx}`} className="message-ul">{listItems}</ul>);
        listItems = [];
        inList = false;
      }
      if (inOrderedList) {
        elements.push(<ol key={`ol_${idx}`} className="message-ol">{orderedListItems}</ol>);
        orderedListItems = [];
        inOrderedList = false;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      // 1. Nhận diện tiêu đề h3 (### )
      if (trimmed.startsWith('### ')) {
        closeListIfAny(idx);
        elements.push(<h3 key={`h3_${idx}`} className="message-h3">{parseBold(trimmed.substring(4))}</h3>);
      }
      // 2. Nhận diện tiêu đề h2 (## )
      else if (trimmed.startsWith('## ')) {
        closeListIfAny(idx);
        elements.push(<h2 key={`h2_${idx}`} className="message-h2">{parseBold(trimmed.substring(3))}</h2>);
      }
      // 3. Nhận diện trích dẫn luật gốc (> )
      else if (trimmed.startsWith('> ')) {
        closeListIfAny(idx);
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
        if (inOrderedList) {
          elements.push(<ol key={`ol_${idx}`} className="message-ol">{orderedListItems}</ol>);
          orderedListItems = [];
          inOrderedList = false;
        }
        inList = true;
        listItems.push(<li key={`li_${idx}`}>{parseBold(trimmed.substring(2))}</li>);
      } 
      // 4b. Nhận diện danh sách đánh số thứ tự (ví dụ: 1. Giấy tờ tùy thân)
      else if (trimmed.match(/^\d+\.\s+/)) {
        if (inList) {
          elements.push(<ul key={`ul_${idx}`} className="message-ul">{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        inOrderedList = true;
        const matchIndex = trimmed.indexOf('.');
        const listContent = trimmed.substring(matchIndex + 1).trim();
        orderedListItems.push(<li key={`ol_li_${idx}`}>{parseBold(listContent)}</li>);
      }
      // 5. Nhận diện dòng trống tạo khoảng cách
      else if (trimmed === '') {
        closeListIfAny(idx);
        elements.push(<div key={`space_${idx}`} className="message-space" />);
      } 
      // 6. Đoạn văn thường
      else {
        closeListIfAny(idx);
        elements.push(<p key={`p_${idx}`} className="message-p">{parseBold(line)}</p>);
      }
    });

    if (inList) {
      elements.push(<ul key="ul_final" className="message-ul">{listItems}</ul>);
    }
    if (inOrderedList) {
      elements.push(<ol key="ol_final" className="message-ol">{orderedListItems}</ol>);
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

          {/* Quá trình tiền xử lý và phân tích RAG */}
          {isAi && message.steps && message.steps.length > 0 && (
            <div className="message-rag-steps-container">
              <div className="rag-steps-header">
                <span className="rag-steps-title-text">Quá trình phân tích RAG</span>
              </div>
              <ul className="rag-steps-list">
                {message.steps.map((step) => {
                  const isSuccess = step.status === 'success';
                  const isRunning = step.status === 'running';
                  return (
                    <li key={step.id} className={`rag-step-item ${step.status}`}>
                      <span className="step-status-icon">
                        {isSuccess && '✔'}
                        {isRunning && <span className="step-spinner" />}
                      </span>
                      <span className="step-label-text">{step.label}</span>
                    </li>
                  );
                })}
              </ul>
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
                    onClick={() => onCitationClick(cit.id, cit.sourceText)}
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
