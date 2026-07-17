import React from 'react';
import SearchBar from './SearchBar';
import GraphCanvas from './GraphCanvas';
import NodeDetailSidebar from './NodeDetailSidebar';
import './GraphWorkspace.css';

export const GraphWorkspace = () => {
  return (
    <div className="graph-workspace">
      {/* Vùng canvas chính vẽ đồ thị + Tìm kiếm nổi */}
      <div className="graph-main-area">
        <SearchBar />
        <GraphCanvas />
      </div>

      {/* Sidebar hiển thị thông tin chi tiết & lịch sử khi click Node */}
      <NodeDetailSidebar />
    </div>
  );
};

export default GraphWorkspace;
