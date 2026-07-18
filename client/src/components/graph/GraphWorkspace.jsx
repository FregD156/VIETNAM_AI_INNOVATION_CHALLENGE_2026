import React from 'react';
import SearchBar from './SearchBar';
import GraphCanvas from './GraphCanvas';
import NodeDetailSidebar from './NodeDetailSidebar';
import GraphLegend from './GraphLegend';
import { useGraphData } from '../../hooks/useGraphData';
import './GraphWorkspace.css';

export const GraphWorkspace = () => {
  const { selectedNode } = useGraphData();

  return (
    <div className="graph-workspace">
      {/* Vùng canvas chính vẽ đồ thị + Tìm kiếm nổi */}
      <div className="graph-main-area">
        <SearchBar />
        <GraphCanvas />
        <GraphLegend />
      </div>

      {/* Sidebar hiển thị thông tin chi tiết & lịch sử khi click Node */}
      {selectedNode && <NodeDetailSidebar />}
    </div>
  );
};

export default GraphWorkspace;
