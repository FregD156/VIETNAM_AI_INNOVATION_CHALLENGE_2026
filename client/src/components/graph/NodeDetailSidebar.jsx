import React from 'react';
import { LuX, LuInfo, LuBookOpen, LuCalendar, LuTag, LuBrain, LuTriangleAlert, LuSparkles } from 'react-icons/lu';
import { useGraphData } from '../../hooks/useGraphData';
import VersionTimeline from './VersionTimeline';
import './NodeDetailSidebar.css';

// Dữ liệu Mock AI Insight để tăng tính thông minh và demo-able
// Dữ liệu Mock AI Insight sinh động dựa theo từ khóa trong văn bản để demo-able tốt nhất
const getAiInsight = (nodeId, nodeText, nodeTitle) => {
  const text = (nodeText || '').toLowerCase();
  const title = (nodeTitle || '').toLowerCase();

  // 1. Nhận diện eKYC, Sinh trắc học, CCCD
  if (text.includes('ekyc') || text.includes('căn cước') || text.includes('chứng minh') || text.includes('nfc') || title.includes('ekyc') || nodeId.includes('ekyc')) {
    return {
      risk: 'Trung bình',
      riskClass: 'risk-medium',
      summary: 'Quy định về việc mở tài khoản và nhận biết khách hàng bằng phương thức điện tử (eKYC). Đảm bảo tuân thủ nghiêm ngặt Thông tư 16/2020/TT-NHNN của NHNN.',
      actionNote: 'Yêu cầu RM hướng dẫn khách hàng quét NFC CCCD gắn chip trên ứng dụng SHB Mobile để xác thực sinh trắc học trùng khớp dữ liệu Bộ Công an.'
    };
  }

  // 2. Nhận diện hạn mức trực tuyến, cho vay online
  if (text.includes('hạn mức') || text.includes('trực tuyến') || text.includes('tiêu dùng online') || text.includes('cho vay') || title.includes('hạn mức')) {
    return {
      risk: 'Cao (Kiểm soát)',
      riskClass: 'risk-high',
      summary: 'Thông tư 06/2023/TT-NHNN quy định cứng hạn mức vay tiêu dùng trực tuyến tối đa 100 triệu VNĐ nhằm hạn chế nợ xấu phát sinh hàng loạt.',
      actionNote: 'Áp dụng cấu hình kiểm soát tự động trên hệ thống SHB Mobile. Tuyệt đối không phê duyệt vượt hạn mức 100 triệu đối với kênh trực tuyến.'
    };
  }

  // 3. Nhận diện gia hạn nợ, lãi suất quá hạn, cơ cấu nợ
  if (text.includes('gia hạn') || text.includes('lãi suất') || text.includes('quá hạn') || text.includes('phụ lục') || title.includes('tín dụng')) {
    return {
      risk: 'Trung bình',
      riskClass: 'risk-medium',
      summary: 'Quy định phương thức thỏa thuận gia hạn nợ và điều chỉnh lãi suất. Cần kiểm soát chặt chẽ để tránh chuyển nhóm nợ xấu ngoài ý muốn.',
      actionNote: 'Cần kiểm tra kỹ lịch sử xếp hạng tín dụng nội bộ của khách hàng trước khi ký kết phụ lục hợp đồng tín dụng gia hạn.'
    };
  }

  // 4. Trường hợp mặc định cho các điều khoản khác
  return {
    risk: 'Thấp (Tuân thủ)',
    riskClass: 'risk-low',
    summary: 'Quy định quy trình nghiệp vụ nội bộ theo chuẩn SHB. Cung cấp bối cảnh kiểm soát phục vụ RM khi thực thi quy trình tác nghiệp tín dụng và bán lẻ.',
    actionNote: 'Tuân thủ đúng trình tự các bước hướng dẫn tác nghiệp; ghi nhận đầy đủ hồ sơ minh chứng trên hệ thống lõi SHB.'
  };
};

export const NodeDetailSidebar = () => {
  const { selectedNode, setSelectedNode } = useGraphData();

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
  const text = selectedNode.data.content || selectedNode.data.text || '';
  const isNhnn = docType === 'NHNN' || selectedNode.id.includes('tt');
  const insight = getAiInsight(selectedNode.id, text, title);

  // Gửi câu hỏi nhanh sang chatbot
  const handleAskAI = () => {
    const query = `Hãy giải thích chi tiết và đưa ra hướng dẫn áp dụng cho điều khoản "${title}" (${selectedNode.id})`;
    
    // 1. Chuyển tab sang AI Chat
    window.dispatchEvent(new CustomEvent('change-tab', { detail: 'chat' }));
    
    // 2. Tự động nhập và gửi tin nhắn
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('auto-send-chat', { detail: query }));
    }, 300);
  };

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
            <span className={`detail-status-pill ${status}`}>
              {status === 'active' ? 'Có hiệu lực' : 'Hết hiệu lực'}
            </span>
            <span className={`detail-source-pill ${isNhnn ? 'nhnn' : 'shb'}`}>
              {isNhnn ? 'NHNN Ban Hành' : 'Quy Chế SHB'}
            </span>
            <span className="detail-date-pill monospace">
              Ngày hiệu lực: {effective_date}
            </span>
          </div>
        </div>

        {/* CẢI TIẾN ĐỘT PHÁ: PANEL AI INSIGHT VÀ ACTIONS */}
        {rawLabel === 'Clause' && (
          <div className="detail-panel-section ai-insight-panel panel">
            <div className="ai-insight-header">
              <div className="ai-header-left">
                <LuBrain className="ai-insight-icon glow-orange-icon" />
                <span className="ai-insight-title">Phân tích RAG Insight</span>
              </div>
            </div>
            <div className="ai-insight-content">
              <p className="ai-insight-summary">{insight.summary}</p>
              <div className="ai-action-recommendation">
                <span className="rec-title">Hành động của RM:</span>
                <p className="rec-text">{insight.actionNote}</p>
              </div>
            </div>
            
            {/* Nút bấm thông minh liên kết Chatbot */}
            <button 
              className="btn-ask-ai-link interactive"
              onClick={handleAskAI}
              title="Đặt câu hỏi chi tiết về điều khoản này cho AI Chatbot"
            >
              <LuSparkles className="btn-icon-sparkle" />
              <span>Hỏi Trợ lý AI về điều khoản này</span>
            </button>
          </div>
        )}

        {/* Paper Surface for raw legal text */}
        {rawLabel === 'Clause' && text && (
          <div className="detail-panel-section">
            <span className="section-label-text block-margin">Nội dung văn bản gốc</span>
            <div className="detail-paper-surface-text paper-surface">
              {(() => {
                const highlightText = selectedNode.data.highlightText;
                if (!highlightText) {
                  return <p className="legal-paragraph">{text}</p>;
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
