import React from 'react';
import { LuX, LuInfo } from 'react-icons/lu';
import { useGraphData } from '../../hooks/useGraphData';
import VersionTimeline from './VersionTimeline';
import './NodeDetailSidebar.css';

export const NodeDetailSidebar = () => {
  const { selectedNode, setSelectedNode } = useGraphData();

  if (!selectedNode) {
    return (
      <div className="node-detail-sidebar">
        <div className="sidebar-placeholder">
          <LuInfo className="placeholder-icon" />
          <p>Chọn một node trên đồ thị để khám phá thông tin chi tiết và lịch sử điều khoản</p>
        </div>
      </div>
    );
  }

  const { title, text, status, docType, effective_date, rawLabel } = selectedNode.data;

  return (
    <div className="node-detail-sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <span className="sidebar-title">Chi Tiết Điều Khoản</span>
        <button className="btn-close" onClick={() => setSelectedNode(null)}>
          <LuX />
        </button>
      </div>

      {/* Sidebar Body */}
      <div className="sidebar-body">
        {/* Tiêu đề & Loại */}
        <div className="detail-section">
          <span className="detail-label">Tên Quy Định / Điều Khoản</span>
          <span className="detail-value" style={{ fontWeight: 700, fontSize: '14px' }}>{title}</span>
        </div>

        {/* Trạng thái & Ngày */}
        <div className="detail-section">
          <span className="detail-label">Thông tin cơ sở</span>
          <div className="detail-badge-row">
            <span className={`timeline-status ${status}`}>
              {status === 'active' ? 'Có hiệu lực' : 'Hết hiệu lực'}
            </span>
            <span className="timeline-status" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--color-text-secondary)' }}>
              Ban hành: {effective_date}
            </span>
          </div>
        </div>

        {/* Nội dung gốc */}
        {rawLabel === 'Clause' && text && (
          <div className="detail-section">
            <span className="detail-label">Nội Dung Điều Khoản Gốc</span>
            <div className="detail-value-text">
              {text}
            </div>
          </div>
        )}

        {/* Trục lịch sử Timeline */}
        {rawLabel === 'Clause' && (
          <div className="detail-section" style={{ marginTop: '10px' }}>
            <span className="detail-label">Lịch sử sửa đổi & Sắp xếp thời gian</span>
            <VersionTimeline nodeId={selectedNode.id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeDetailSidebar;
