import React from 'react';
import { useGraphData } from '../../hooks/useGraphData';
import { LuCheck, LuRotateCcw } from 'react-icons/lu';
import './GraphLegend.css';

export const GraphLegend = () => {
  const { activeFilters, toggleFilter, clearFilters } = useGraphData();

  // Kiểm tra xem có bộ lọc màu nào đang hoạt động không
  const hasActiveFilters = Object.values(activeFilters).some(v => v);

  return (
    <div className="graph-legend-panel panel">
      <div className="legend-header">
        <span className="legend-sec-title">Phân loại Nút</span>
        {hasActiveFilters && (
          <button className="btn-legend-reset" onClick={clearFilters} title="Xóa tất cả bộ lọc màu">
            <LuRotateCcw size={12} />
          </button>
        )}
      </div>
      
      <div className="legend-section">
        <div className="legend-items-list">
          <div 
            className={`legend-item filterable ${activeFilters.shb ? 'active' : ''} ${hasActiveFilters && !activeFilters.shb ? 'inactive' : ''}`}
            onClick={() => toggleFilter('shb')}
          >
            <span className="dot-color-indicator node-shb">
              {activeFilters.shb && <LuCheck className="legend-check-icon" />}
            </span>
            <span className="legend-item-text">Quy chế SHB</span>
          </div>
          <div 
            className={`legend-item filterable ${activeFilters.nhnn ? 'active' : ''} ${hasActiveFilters && !activeFilters.nhnn ? 'inactive' : ''}`}
            onClick={() => toggleFilter('nhnn')}
          >
            <span className="dot-color-indicator node-nhnn">
              {activeFilters.nhnn && <LuCheck className="legend-check-icon" />}
            </span>
            <span className="legend-item-text">Thông tư NHNN</span>
          </div>
          <div 
            className={`legend-item filterable ${activeFilters.active ? 'active' : ''} ${hasActiveFilters && !activeFilters.active ? 'inactive' : ''}`}
            onClick={() => toggleFilter('active')}
          >
            <span className="dot-color-indicator node-active">
              {activeFilters.active && <LuCheck className="legend-check-icon" />}
            </span>
            <span className="legend-item-text">Còn hiệu lực</span>
          </div>
          <div 
            className={`legend-item filterable ${activeFilters.expired ? 'active' : ''} ${hasActiveFilters && !activeFilters.expired ? 'inactive' : ''}`}
            onClick={() => toggleFilter('expired')}
          >
            <span className="dot-color-indicator node-expired">
              {activeFilters.expired && <LuCheck className="legend-check-icon" />}
            </span>
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
