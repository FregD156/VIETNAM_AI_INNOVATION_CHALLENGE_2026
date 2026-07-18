import React, { useMemo } from 'react';
import { useGraphData } from '../../hooks/useGraphData';
import './VersionTimeline.css';

export const VersionTimeline = ({ nodeId = '' }) => {
  const { graphData } = useGraphData();

  // Tự động tính toán và trích xuất dòng thời gian từ đồ thị tri thức RAG
  const timelineItems = useMemo(() => {
    if (!nodeId || !graphData || !graphData.nodes) return [];
    
    // 1. Tìm node hiện tại đang chọn để lấy bối cảnh làm gốc đối sánh
    const currentNode = graphData.nodes.find(n => n.id === nodeId);
    if (!currentNode || !currentNode.data) {
      // Fallback nếu click từ trích dẫn chatbot chưa load kịp node đồ thị
      return [
        {
          year: '2026',
          status: 'active',
          version: 'Hiện tại',
          text: 'Văn bản được trích lục trực tiếp từ bối cảnh RAG.'
        }
      ];
    }
    
    const d = currentNode.data;
    const currentProvId = d.provision_id;
    const currentArticle = d.article;
    const currentClause = d.clause;
    
    // 2. Quét đồ thị để tìm tất cả các phiên bản liên quan (cùng provision_id hoặc cùng số điều + khoản)
    const relatedNodes = graphData.nodes.filter(n => {
      // Chỉ quan tâm tới các node điều khoản
      if (n.type !== 'clauseNode' && n.data?.rawLabel !== 'Clause') return false;
      
      const nd = n.data || {};
      
      // Luôn giữ lại chính node đang chọn
      if (n.id === nodeId) return true;
      
      // Nếu có provision_id thì so khớp theo chi tiết mã nghiệp vụ
      if (currentProvId && nd.provision_id && nd.provision_id === currentProvId) {
        return true;
      }
      
      // Chỉ so khớp theo điều + khoản khi cả hai đều có giá trị thực tế khác rỗng
      if (currentArticle && currentClause && nd.article === currentArticle && nd.clause === currentClause) {
        return true;
      }
      
      return false;
    });
    
    // 3. Map sang cấu trúc dữ liệu hiển thị của dòng thời gian
    const items = relatedNodes.map(n => {
      const nd = n.data || {};
      
      // Trích xuất năm hiệu lực
      let year = 'Ban hành';
      if (nd.effective_date) {
        const parts = nd.effective_date.split('-');
        if (parts.length > 0) year = parts[0];
      }
      
      // Trạng thái hiệu lực
      const isStatusActive = nd.status === 'active' || nd.status === 'Còn hiệu lực';
      const status = isStatusActive ? 'active' : 'expired';
      
      // Định nghĩa số phiên bản thông minh dựa theo thứ tự thời gian
      const version = nd.version_id || nd.version || (isStatusActive ? 'v2.0' : 'v1.0');
      
      return {
        id: n.id,
        year: year,
        date: nd.effective_date || '',
        status: status,
        version: version,
        text: nd.content || nd.text || '',
        docNum: nd.doc_num || ''
      };
    });
    
    // 4. Sắp xếp theo ngày hiệu lực tăng dần từ cũ nhất tới mới nhất
    return items.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateA.localeCompare(dateB);
    });
  }, [nodeId, graphData]);

  if (timelineItems.length === 0) {
    return (
      <div className="version-timeline-empty">
        <p className="timeline-empty-text">Không tìm thấy lịch sử phiên bản của điều khoản này trên đồ thị.</p>
      </div>
    );
  }

  return (
    <div className="version-timeline-container">
      <div className="timeline-axis-line"></div>
      
      {timelineItems.map((item, idx) => {
        const isActive = item.status === 'active';
        return (
          <div key={idx} className={`timeline-version-card ${isActive ? 'active-version' : 'expired-version'}`}>
            {/* Timeline Dot: Tròn tuyệt đối */}
            <div className={`timeline-indicator-dot ${item.status}`} />
            
            {/* Card Header metadata */}
            <div className="timeline-card-header">
              <span className="timeline-version-badge monospace">{item.version}</span>
              <span className="timeline-year-text monospace">
                Năm ban hành: {item.year} {item.docNum && `(${item.docNum})`}
              </span>
            </div>

            {/* Card Text Content */}
            <div className="timeline-card-body-text">
              {item.text}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VersionTimeline;
