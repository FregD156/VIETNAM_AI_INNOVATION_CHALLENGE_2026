import React, { useState } from 'react';
import { diffWords } from 'diff';
import { LuCheck, LuGitCommitHorizontal, LuInfo } from 'react-icons/lu';
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
      <div className="change-preview-container">
        <span className="preview-title">Đề xuất cập nhật sơ đồ đồ thị tri thức</span>
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LuInfo />
          <span>Hãy upload tài liệu để sinh bản so sánh thay đổi pháp lý.</span>
        </div>
      </div>
    );
  }

  // Sử dụng thư viện diff để so sánh chuỗi cấp độ từ
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
    }, 3000);
  };

  return (
    <div className="change-preview-container">
      <span className="preview-title">{diffPreviewData.title}</span>

      {/* Kết quả so sánh text */}
      <div className="diff-viewer">
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

      {/* Đề xuất liên kết mới trên Neo4j */}
      <div className="proposed-rels-list">
        <span className="detail-label" style={{ fontSize: '10px' }}>Đề xuất liên kết đồ thị Neo4j:</span>
        {diffPreviewData.proposedRelations.map((rel, idx) => {
          const isSuper = rel.type === 'SUPERSEDES';
          return (
            <div key={idx} className="rel-item">
              <span className={`rel-badge ${isSuper ? 'supersedes' : 'references'}`}>
                {rel.type}
              </span>
              <span className="rel-desc">{rel.description}</span>
            </div>
          );
        })}
      </div>

      {/* Nút phê duyệt */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        {showStatus ? (
          <span style={{ fontSize: '12px', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LuCheck /> Đã phê duyệt và đồng bộ đồ thị Neo4j thành công!
          </span>
        ) : <span />}

        <button 
          className="btn-approve" 
          onClick={handleApprove}
          disabled={isApproved}
        >
          <LuGitCommitHorizontal />
          <span>{isApproved ? 'Đã Phê Duyệt' : 'Phê Duyệt & Đồng Bộ Đồ Thị'}</span>
        </button>
      </div>
    </div>
  );
};

export default GraphChangePreview;
