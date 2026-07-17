import React, { useEffect } from 'react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState 
} from 'reactflow';
import { useGraphData } from '../../hooks/useGraphData';
import DocumentNode from './nodes/DocumentNode';
import ClauseNode from './nodes/ClauseNode';

import 'reactflow/dist/style.css';
import './GraphCanvas.css';

// Đăng ký các component Node tùy chỉnh trong React Flow
const nodeTypes = {
  documentNode: DocumentNode,
  clauseNode: ClauseNode
};

export const GraphCanvas = () => {
  const { graphData, setSelectedNode } = useGraphData();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Đồng bộ hóa dữ liệu từ context khi đồ thị thay đổi (nạp mới hoặc lọc tìm kiếm)
  useEffect(() => {
    if (graphData) {
      setNodes(graphData.nodes);
      setEdges(graphData.edges);
    }
  }, [graphData, setNodes, setEdges]);

  const handleNodeClick = (event, node) => {
    setSelectedNode(node);
  };

  const handlePaneClick = () => {
    setSelectedNode(null);
  };

  return (
    <div className="graph-canvas-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Controls />
        <MiniMap zoomable pannable nodeStrokeColor={(n) => {
          if (n.type === 'documentNode') return '#d4af37';
          return n.data.status === 'active' ? '#10b981' : '#ef4444';
        }} nodeColor={(n) => {
          return 'rgba(15, 23, 42, 0.8)';
        }} />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default GraphCanvas;
