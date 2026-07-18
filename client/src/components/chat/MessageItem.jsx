import React from 'react';
import { LuSparkles, LuUser } from 'react-icons/lu';
import CitationTag from './CitationTag';
import WarningCard from './WarningCard';
import ActionableDraft from './ActionableDraft';
import './MessageItem.css';

export const MessageItem = ({ message, onCitationClick }) => {
  const isAi = message.sender === 'ai';

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
          <blockquote key={`bq_${idx}`} className="message-blockquote">
            {parseBold(trimmed.substring(2))}
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

      <div className={`message-bubble-box ${message.isWelcome ? 'welcome' : ''}`}>
        {/* Header tin nhắn */}
        <div className="message-bubble-header">
          <span className="bubble-sender-name">
            {isAi ? 'Trợ lý AI Pháp quy SHB' : 'Cán bộ RM (Nguyễn Văn An)'}
          </span>
          <span className="bubble-message-time">{message.timestamp}</span>
        </div>

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
            <span className="citations-header-label">Nguồn trích dẫn:</span>
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

      {!isAi && (
        <div className="message-avatar user-avatar animate-fade-in" title="RM Nguyễn Văn An">
          <LuUser />
        </div>
      )}
    </div>
  );
};

export default MessageItem;
