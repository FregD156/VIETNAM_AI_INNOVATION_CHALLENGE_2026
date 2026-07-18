import React from 'react';
import { LuX, LuInfo, LuBookOpen, LuCalendar, LuTag, LuBrain, LuTriangleAlert, LuSparkles } from 'react-icons/lu';
import { useGraphData } from '../../hooks/useGraphData';
import VersionTimeline from './VersionTimeline';
import './NodeDetailSidebar.css';

// Dữ liệu Mock AI Insight để tăng tính thông minh và demo-able
const getAiInsight = (nodeId) => {
  const insights = {
    'clause_5_tt39': {
      risk: 'Trung bình',
      riskClass: 'risk-medium',
      summary: 'Quy định phương thức thỏa thuận gia hạn nợ và lãi suất. Hiện tại đã bị sửa đổi và thắt chặt kiểm soát nợ quá hạn bởi Thông tư 06/2023.',
      actionNote: 'Cần kiểm tra kỹ lịch sử xếp hạng tín dụng nội bộ của khách hàng trước khi ký phụ lục gia hạn.'
    },
    'clause_5_tt06': {
      risk: 'Thấp (Tuân thủ)',
      riskClass: 'risk-low',
      summary: 'Thông tư 06/2023/TT-NHNN quy định cứng hạn mức vay tiêu dùng online tối đa 100 triệu VNĐ nhằm hạn chế nợ xấu phát sinh hàng loạt.',
      actionNote: 'Áp dụng cấu hình kiểm soát tự động trên hệ thống SHB Mobile. Tuyệt đối không phê duyệt vượt hạn mức.'
    },
    'clause_14_qd214': {
      risk: 'Cao (Mâu thuẫn Luật)',
      riskClass: 'risk-high',
      summary: 'Mâu thuẫn nghiêm trọng với Thông tư 06/2023/TT-NHNN của Ngân hàng Nhà nước. Hạn mức nội bộ 500 triệu của quyết định 214 này đã lỗi thời và vượt quá 5 lần giới hạn pháp lý đối với kênh trực tuyến.',
      actionNote: 'Tạm dừng giải ngân gói đối tác 500 triệu trực tuyến; chuyển hướng phê duyệt hồ sơ giấy truyền thống.'
    },
    'clause_12_tt16': {
      risk: 'Trung bình',
      riskClass: 'risk-medium',
      summary: 'Thông tư NHNN khống chế giao dịch eKYC 100 triệu/tháng nhằm phòng chống rửa tiền và tạo tài khoản ảo.',
      actionNote: 'Kiểm tra khớp thông tin sinh trắc học khuôn mặt trùng với cơ sở dữ liệu Bộ Công an.'
    },
    'clause_9_qd104': {
      risk: 'Thấp (Tuân thủ)',
      riskClass: 'risk-low',
      summary: 'Quyết định nội bộ SHB đã cập nhật đúng hướng dẫn của Thông tư 16. Bắt buộc thu thập dữ liệu CCCD gắn chip NFC.',
      actionNote: 'Yêu cầu RM hướng dẫn chi tiết khách hàng cách quét NFC trên điện thoại thông minh.'
    }
  };

  return insights[nodeId] || {
    risk: 'Chưa đánh giá',
    riskClass: 'risk-unknown',
    summary: 'Hệ thống RAG AI đang tổng hợp cấu trúc liên kết và lịch sử của điều khoản này từ đồ thị.',
    actionNote: 'Vui lòng liên hệ Phòng Pháp chế và Tuân thủ SHB để nhận thông tin chi tiết.'
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

  const { title, text, status, docType, effective_date, rawLabel } = selectedNode.data;
  const isNhnn = docType === 'NHNN' || selectedNode.id.includes('tt');
  const insight = getAiInsight(selectedNode.id);

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
              <span className={`ai-risk-badge ${insight.riskClass}`}>
                <LuTriangleAlert className="risk-icon-mini" />
                {insight.risk}
              </span>
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
              <p className="legal-paragraph">{text}</p>
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
