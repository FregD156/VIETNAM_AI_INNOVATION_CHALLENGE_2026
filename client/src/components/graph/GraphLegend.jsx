import React from 'react';
import './GraphLegend.css';

export const GraphLegend = () => {
  return (
    <div className="graph-legend-panel panel">
      <div className="legend-section">
        <span className="legend-sec-title">Phân loại Nút</span>
        <div className="legend-items-list">
          <div className="legend-item">
            <span className="dot-color-indicator node-shb"></span>
            <span className="legend-item-text">Quy chế SHB</span>
          </div>
          <div className="legend-item">
            <span className="dot-color-indicator node-nhnn"></span>
            <span className="legend-item-text">Thông tư NHNN</span>
          </div>
          <div className="legend-item">
            <span className="dot-color-indicator node-active"></span>
            <span className="legend-item-text">Còn hiệu lực</span>
          </div>
          <div className="legend-item">
            <span className="dot-color-indicator node-expired"></span>
            <span className="legend-item-text">Hết hiệu lực</span>
          </div>
        </div>
      </div>

      <div className="legend-divider"></div>

      <div className="legend-section">
        <span className="legend-sec-title">Liên kết Đường</span>
        <div className="legend-items-list">
          <div className="legend-item">
            <span className="line-color-indicator edge-has"></span>
            <span className="legend-item-text">Chứa điều khoản</span>
          </div>
          <div className="legend-item">
            <span className="line-color-indicator edge-supersedes"></span>
            <span className="legend-item-text">Thay thế bản cũ</span>
          </div>
          <div className="legend-item">
            <span className="line-color-indicator edge-references"></span>
            <span className="legend-item-text">Tham chiếu chéo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphLegend;
