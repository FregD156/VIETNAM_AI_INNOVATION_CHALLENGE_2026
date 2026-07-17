import React from 'react';
import CitationTag from './CitationTag';
import WarningCard from './WarningCard';
import ActionableDraft from './ActionableDraft';
import './MessageItem.css';

export const MessageItem = ({ message, onCitationClick }) => {
  const isAi = message.sender === 'ai';

  // Parser Markdown đơn giản bằng JS thuần để tuân thủ quy định không tự ý cài thư viện ngoài
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
      
      // Kiểm tra xem có phải dòng danh sách không
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        inList = true;
        listItems.push(<li key={`li_${idx}`}>{parseBold(trimmed.substring(2))}</li>);
      } else {
        if (inList) {
          elements.push(<ul key={`ul_${idx}`}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }

        if (trimmed === '') {
          elements.push(<div key={`space_${idx}`} style={{ height: '8px' }} />);
        } else {
          elements.push(<p key={`p_${idx}`}>{parseBold(line)}</p>);
        }
      }
    });

    if (inList) {
      elements.push(<ul key="ul_final">{listItems}</ul>);
    }

    return elements;
  };

  return (
    <div className={`message-item-container ${message.sender}`}>
      <div className={`message-bubble ${message.isWelcome ? 'welcome-bubble' : ''}`}>
        {/* Header tin nhắn */}
        <div className="message-meta">
          <span className="sender-name">
            {isAi ? 'Trợ lý AI Pháp quy' : 'Cán bộ RM'}
          </span>
          <span className="message-time">{message.timestamp}</span>
        </div>

        {/* Nội dung text */}
        <div className="message-body">
          {parseText(message.text)}
          
          {/* Cần stream cursor nếu tin nhắn đang chạy và chưa có chữ */}
          {isAi && message.text === '' && <span className="cursor-blink" />}
        </div>

        {/* Cảnh báo xung đột nếu có */}
        {isAi && message.has_conflict && <WarningCard />}

        {/* Bản nháp email / script nếu có */}
        {isAi && message.actionable_draft && (
          <ActionableDraft draft={message.actionable_draft} />
        )}

        {/* Tags trích dẫn ở cuối bong bóng chat */}
        {isAi && message.citations && message.citations.length > 0 && (
          <div className="message-citations">
            <span className="citations-label">Nguồn trích dẫn:</span>
            {message.citations.map((cit) => (
              <CitationTag 
                key={cit.id} 
                id={cit.id} 
                label={cit.label} 
                onClick={onCitationClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
