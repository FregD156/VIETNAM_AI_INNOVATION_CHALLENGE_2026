import React from 'react';
import { LuX, LuInfo, LuBookOpen, LuCalendar, LuTag, LuBrain, LuTriangleAlert, LuSparkles, LuArrowLeft } from 'react-icons/lu';
import { useGraphData } from '../../hooks/useGraphData';
import VersionTimeline from './VersionTimeline';
import './NodeDetailSidebar.css';



export const NodeDetailSidebar = () => {
  const { 
    selectedNode, 
    setSelectedNode, 
    graphData,
    viewMode,
    setViewMode,
    activeDocId,
    setActiveDocId
  } = useGraphData();

  // Phân tách chuỗi dẹt từ Backend thành các dòng riêng biệt theo Chương/Điều/Khoản
  const formatLegalTextToLines = (rawText) => {
    if (!rawText) return [];
    
    // Tách dòng các Clause đã gộp bằng ###
    if (rawText.includes('### ')) {
      return rawText.split('\n').filter(line => line.trim());
    }

    let formatted = rawText
      .replace(/\s+-\s+Chương\s+/g, '\nChương ')
      .replace(/\s+-\s+Điều\s+/g, '\nĐiều ')
      .replace(/\s+-\s+Khoản\s+/g, '\nKhoản ')
      .replace(/\s+-\s+Điểm\s+/g, '\nĐiểm ');
      
    return formatted.split('\n').map(line => line.trim()).filter(Boolean);
  };

  // Parse markdown in đậm **text** thành JSX strong
  const parseBoldMarkdown = (textStr) => {
    if (!textStr) return '';
    const parts = textStr.split(/\*\*([^*]+)\*\*/g);
    if (parts.length === 1) return textStr;
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="legal-bold-text">{part}</strong>;
      }
      return part;
    });
  };

  // Render văn bản phân cấp có cấu trúc đẹp mắt kèm highlight RAG chéo
  const renderFormattedLegalText = (rawText, highlightText = '') => {
    if (!rawText) return null;
    
    const lines = formatLegalTextToLines(rawText);
    const cleanHighlight = (highlightText || '').trim();
    
    return lines.map((line, idx) => {
      let className = "legal-paragraph indent-paragraph";
      let isDocHeader = false;
      let isArticleHeader = false;
      let isSectionTitle = false;
      
      if (line.startsWith('### ')) {
        className = "legal-section-title";
        isSectionTitle = true;
      } else if (idx === 0) {
        className = "legal-doc-header";
        isDocHeader = true;
      } else if (line.startsWith('Chương ') || line.startsWith('Điều ')) {
        className = "legal-article-header";
        isArticleHeader = true;
      }
      
      const cleanLine = isSectionTitle ? line.replace('### ', '') : line;
      
      // Nếu có highlightText, tìm kiếm và highlight trong dòng
      if (cleanHighlight && cleanLine.toLowerCase().includes(cleanHighlight.toLowerCase())) {
        const startIdx = cleanLine.toLowerCase().indexOf(cleanHighlight.toLowerCase());
        if (startIdx !== -1) {
          const before = cleanLine.substring(0, startIdx);
          const match = cleanLine.substring(startIdx, startIdx + cleanHighlight.length);
          const after = cleanLine.substring(startIdx + cleanHighlight.length);
          
          if (isSectionTitle) return <h4 key={idx} className={className}>{parseBoldMarkdown(before)}<span className="legal-highlight-match">{match}</span>{parseBoldMarkdown(after)}</h4>;
          if (isDocHeader) return <h4 key={idx} className={className}>{parseBoldMarkdown(before)}<span className="legal-highlight-match">{match}</span>{parseBoldMarkdown(after)}</h4>;
          if (isArticleHeader) return <h5 key={idx} className={className}>{parseBoldMarkdown(before)}<span className="legal-highlight-match">{match}</span>{parseBoldMarkdown(after)}</h5>;
          return <p key={idx} className={className}>{parseBoldMarkdown(before)}<span className="legal-highlight-match">{match}</span>{parseBoldMarkdown(after)}</p>;
        }
      }
      
      if (isSectionTitle) return <h4 key={idx} className={className}>{parseBoldMarkdown(cleanLine)}</h4>;
      if (isDocHeader) return <h4 key={idx} className={className}>{parseBoldMarkdown(cleanLine)}</h4>;
      if (isArticleHeader) return <h5 key={idx} className={className}>{parseBoldMarkdown(cleanLine)}</h5>;
      return <p key={idx} className={className}>{parseBoldMarkdown(cleanLine)}</p>;
    });
  };

  if (!selectedNode) {
    return (
      <aside className="node-detail-sidebar placeholder-state">
        <div className="sidebar-placeholder-content">
          <div className="info-glow-icon">
            <LuInfo />
          </div>
          <h3 className="placeholder-title">Đồ Thị Tri Thức SHB</h3>
          <p className="placeholder-desc">
            Chọn một điểm nút (Node) trên đồ thị để khám phá thông tin chi tiết cấu trúc liên đới và lịch sử ban hành điều khoản.
          </p>
        </div>
      </aside>
    );
  }

  const { title, status, docType, effective_date, rawLabel } = selectedNode.data;
  let text = selectedNode.data.content || selectedNode.data.text || '';
  
  // Tự động gộp nội dung của các Clause con trực thuộc nếu đây là đề mục trung gian (như Điều 1) trống nội dung
  if (!text && graphData) {
    const childEdges = graphData.edges.filter(e => e.source === selectedNode.id);
    const childNodes = childEdges
      .map(e => graphData.nodes.find(n => n.id === e.target))
      .filter(c => c && (c.data.content || c.data.text));
      
    if (childNodes.length > 0) {
      text = childNodes.map(c => {
        const cText = c.data.content || c.data.text || '';
        return `### ${c.data.title || c.id}\n${cText}`;
      }).join('\n\n');
    }
  }

  const isNhnn = docType === 'NHNN' || selectedNode.id.includes('tt');

  return (
    <aside className="node-detail-sidebar active-state">
      {/* Sidebar Header */}
      <div className="sidebar-detail-header">
        <div className="header-title-group">
          <LuBookOpen className="header-icon" />
          <span className="header-title-text">Trích lục điều khoản</span>
        </div>
        <button 
          className="btn-sidebar-close" 
          onClick={() => setSelectedNode(null)}
          title="Đóng bảng chi tiết"
        >
          <LuX />
        </button>
      </div>

      {/* Sidebar Body */}
      <div className="sidebar-detail-body">
        {/* Title Section */}
        <div className="detail-panel-section">
          <div className="section-label-group">
            <LuTag className="section-icon" />
            <span className="section-label-text">Tên quy định / Điều khoản</span>
          </div>
          <h2 className="detail-value-main-title">{title}</h2>
        </div>

        {/* Metadata section */}
        <div className="detail-panel-section">
          <div className="section-label-group">
            <LuCalendar className="section-icon" />
            <span className="section-label-text">Thông tin pháp lý</span>
          </div>
          <div className="detail-badges-row-flex">
            <span className={`detail-status-pill ${status === 'active' || status === 'Còn hiệu lực' || status === 'Còn hiệu lực một phần' ? 'active' : 'expired'}`}>
              {status === 'active' || status === 'Còn hiệu lực' || status === 'Còn hiệu lực một phần' ? 'Còn hiệu lực' : 'Hết hiệu lực'}
            </span>
            <span className={`detail-source-pill ${isNhnn ? 'nhnn' : 'shb'}`}>
              {isNhnn ? 'NHNN Ban Hành' : 'Quy Chế SHB'}
            </span>
            <span className="detail-date-pill monospace">
              Ngày hiệu lực: {effective_date}
            </span>
          </div>
        </div>

        {selectedNode.type === 'documentNode' && (
          <div className="detail-panel-section">
            {viewMode === 'macro' ? (
              <button 
                className="btn-ask-ai-link btn-drilldown-action"
                onClick={() => {
                  setActiveDocId(selectedNode.id);
                  setViewMode('micro');
                }}
              >
                <LuSparkles /> Khoan sâu chi tiết (Drill-down)
              </button>
            ) : (
              <button 
                className="btn-ask-ai-link btn-back-macro-action"
                onClick={() => {
                  setViewMode('macro');
                  setActiveDocId(null);
                  setSelectedNode(null);
                }}
                style={{ background: 'var(--navy-surface-raised)', border: '1px solid var(--navy-hairline)', color: 'var(--text-primary)' }}
              >
                <LuArrowLeft /> Quay lại tổng quan
              </button>
            )}
          </div>
        )}

        {/* Paper Surface for raw legal text */}
        {rawLabel === 'Clause' && (
          <div className="detail-panel-section">
            <span className="section-label-text block-margin">Nội dung văn bản gốc</span>
            {text ? (
              <div className="detail-paper-surface-text paper-surface">
                {renderFormattedLegalText(text, selectedNode.data.highlightText)}
                <div className="legal-paper-watermark">SHB COMPLIANCE ORIGINAL</div>
              </div>
            ) : (
              <div className="empty-content-notice">
                <p>Đề mục liên kết trung gian (Không chứa nội dung điều khoản trực tiếp)</p>
              </div>
            )}
          </div>
        )}

        {/* Version Timeline section */}
        {rawLabel === 'Clause' && (
          <div className="detail-panel-section timeline-top-border">
            <span className="section-label-text block-margin">Dòng thời gian & Sửa đổi</span>
            <VersionTimeline nodeId={selectedNode.id} />
          </div>
        )}
      </div>
    </aside>
  );
};

export default NodeDetailSidebar;
