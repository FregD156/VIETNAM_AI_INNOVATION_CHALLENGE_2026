import React from 'react';
import { LuX, LuInfo, LuBookOpen, LuCalendar, LuTag, LuBrain, LuTriangleAlert, LuSparkles } from 'react-icons/lu';
import { useGraphData } from '../../hooks/useGraphData';
import VersionTimeline from './VersionTimeline';
import './NodeDetailSidebar.css';



export const NodeDetailSidebar = () => {
  const { selectedNode, setSelectedNode, graphData } = useGraphData();

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



        {/* Paper Surface for raw legal text */}
        {rawLabel === 'Clause' && (
          <div className="detail-panel-section">
            <span className="section-label-text block-margin">Nội dung văn bản gốc</span>
            {text ? (
              <div className="detail-paper-surface-text paper-surface">
                {(() => {
                  const highlightText = selectedNode.data.highlightText;
                  if (!highlightText) {
                    return text.split('\n').map((para, pIdx) => {
                      if (para.startsWith('### ')) {
                        return <h4 key={pIdx} className="legal-section-title">{para.replace('### ', '')}</h4>;
                      }
                      return para.trim() ? <p key={pIdx} className="legal-paragraph">{para}</p> : null;
                    });
                  }
                  
                  const cleanText = text.replace(/\s+/g, ' ');
                  const cleanHighlight = highlightText.replace(/\s+/g, ' ').trim();
                  
                  const index = cleanText.toLowerCase().indexOf(cleanHighlight.toLowerCase());
                  if (index !== -1) {
                    const before = cleanText.substring(0, index);
                    const match = cleanText.substring(index, index + cleanHighlight.length);
                    const after = cleanText.substring(index + cleanHighlight.length);
                    return (
                      <p className="legal-paragraph">
                        {before}
                        <span className="legal-highlight-match">{match}</span>
                        {after}
                      </p>
                    );
                  }
                  
                  return (
                    <>
                      <div className="rag-chunk-extracted-notice">
                        <span className="notice-title">Đoạn được RAG trích xuất & đối sánh:</span>
                        <p className="notice-content">{highlightText}</p>
                      </div>
                      <p className="legal-paragraph">{text}</p>
                    </>
                  );
                })()}
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
