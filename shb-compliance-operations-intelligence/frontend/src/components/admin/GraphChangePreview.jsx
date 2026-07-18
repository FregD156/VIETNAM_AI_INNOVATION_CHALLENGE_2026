import React, { useState } from 'react';
import { diffWords } from 'diff';
import { LuCheck, LuGitCommitHorizontal, LuInfo, LuLink, LuFileDiff, LuCircleCheck } from 'react-icons/lu';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useGraphData } from '../../hooks/useGraphData';
import './GraphChangePreview.css';

export const GraphChangePreview = () => {
  const { diffPreviewData } = useFileUpload();
  const { addNodeAndRelationships } = useGraphData();
  const [isApproved, setIsApproved] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  if (!diffPreviewData) {
    return (
      <div className="change-preview-container empty-state">
        <div className="empty-preview-content">
          <div className="preview-glow-icon">
            <LuFileDiff />
          </div>
          <h3 className="empty-preview-title">Đề xuất cập nhật Sơ đồ Tri thức</h3>
          <p className="empty-preview-desc">
            Vui lòng nạp tài liệu thông tư hoặc quyết định (PDF) ở panel bên trái. Hệ thống sẽ tự động quét, so sánh các điều khoản cũ/mới và hiển thị đề xuất cập nhật đồ thị tại đây.
          </p>
        </div>
      </div>
    );
  }

  // Sử dụng thư việc diff để so sánh chuỗi cấp độ từ
  const diffParts = diffWords(diffPreviewData.originalText, diffPreviewData.modifiedText);

  const handleApprove = () => {
    setIsApproved(true);
    setShowStatus(true);

    // Tạo các node và quan hệ mới đề xuất phê duyệt
    const newNode = {
      id: "clause_14_qd214_v2",
      label: "Clause",
      properties: {
        id: "clause_14_qd214_v2",
        title: "Điều 14 - QĐ 214/22/SHB (Sửa đổi 2026)",
        text: "Đối với vay online trên ứng dụng SHB Mobile, dư nợ cho vay tối đa đối với một khách hàng không vượt quá 100.000.000 VNĐ.",
        status: "active",
        effective_date: "2026-07-17"
      }
    };

    const newRels = [
      { id: "rel_has_v2", type: "HAS_CLAUSE", start: "doc_qd214", end: "clause_14_qd214_v2" },
      { id: "rel_super_v2", type: "SUPERSEDES", start: "clause_14_qd214_v2", end: "clause_14_qd214" },
      { id: "rel_ref_v2", type: "REFERENCES", start: "clause_14_qd214_v2", end: "clause_5_tt06" }
    ];

    // Thêm trực tiếp vào GraphContext
    addNodeAndRelationships(newNode, newRels);

    setTimeout(() => {
      setShowStatus(false);
    }, 4000);
  };

  return (
    <div className="change-preview-container active-state">
      <div className="preview-active-header">
        <LuFileDiff className="header-icon" />
        <h3 className="preview-active-title">{diffPreviewData.title}</h3>
      </div>

      {/* Comparison Text Container styled as Paper Surface */}
      <div className="diff-viewer-wrapper">
        <span className="section-small-label">So sánh thay đổi điều khoản (Diff Preview)</span>
        <div className="diff-paper-surface paper-surface">
          <div className="diff-content-scroll">
            {diffParts.map((part, index) => {
              if (part.added) {
                return <span key={index} className="diff-added">{part.value}</span>;
              }
              if (part.removed) {
                return <span key={index} className="diff-removed">{part.value}</span>;
              }
              return <span key={index}>{part.value}</span>;
            })}
          </div>
          <div className="diff-paper-watermark">SHB COMPLIANCE DIFF</div>
        </div>
      </div>

      {/* Proposed Neo4j Relations List */}
      <div className="proposed-relations-section">
        <div className="section-label-group">
          <LuLink className="label-icon" />
          <span className="section-small-label">Đề xuất cập nhật liên kết GraphDB (Neo4j)</span>
        </div>
        
        <div className="proposed-relations-list">
          {diffPreviewData.proposedRelations.map((rel, idx) => {
            const isSuper = rel.type === 'SUPERSEDES';
            return (
              <div key={idx} className="rel-card-item">
                <div className="rel-badge-row">
                  <span className={`rel-badge-pill ${isSuper ? 'supersedes' : 'references'}`}>
                    {rel.type}
                  </span>
                  <span className="rel-connector-label">Liên kết thực thể</span>
                </div>
                <p className="rel-card-description">{rel.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer Approval */}
      <div className="preview-footer-action-row">
        {showStatus ? (
          <span className="approve-status-success">
            <LuCircleCheck className="success-icon" />
            <span>Phê duyệt và đồng bộ Neo4j thành công!</span>
          </span>
        ) : (
          <div className="info-helper-text">
            <LuInfo />
            <span>Vui lòng kiểm duyệt kỹ trước khi đồng bộ cơ sở dữ liệu.</span>
          </div>
        )}

        <button 
          className={`btn-approve-submit ${isApproved ? 'approved' : ''}`} 
          onClick={handleApprove}
          disabled={isApproved}
        >
          {isApproved ? <LuCheck /> : <LuGitCommitHorizontal />}
          <span>{isApproved ? 'Đã Phê Duyệt' : 'Phê Duyệt & Đồng Bộ Đồ Thị'}</span>
        </button>
      </div>
    </div>
  );
};

export default GraphChangePreview;
