import React, { useEffect } from 'react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  useReactFlow
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
  const { graphData, selectedNode, setSelectedNode } = useGraphData();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const { setCenter } = useReactFlow();

  // Đồng bộ hóa dữ liệu từ context khi đồ thị thay đổi (nạp mới hoặc lọc tìm kiếm)
  useEffect(() => {
    if (graphData) {
      setNodes(graphData.nodes);
      setEdges(graphData.edges);
    }
  }, [graphData, setNodes, setEdges]);

  // Lắng nghe sự kiện focus node từ bên ngoài (như click CitationTag trong Chat)
  useEffect(() => {
    const handleFocusNode = (e) => {
      const nodeId = e.detail;
      if (!nodeId || !graphData || !graphData.nodes) return;
      
      const targetNode = graphData.nodes.find(n => n.id === nodeId);
      if (targetNode) {
        setSelectedNode(targetNode);
      }
    };

    window.addEventListener('focus-graph-node', handleFocusNode);
    return () => window.removeEventListener('focus-graph-node', handleFocusNode);
  }, [graphData, setSelectedNode]);

  // Smooth pan camera đến tâm Node khi được lựa chọn
  useEffect(() => {
    if (selectedNode && nodes.length > 0) {
      const nodeInFlow = nodes.find(n => n.id === selectedNode.id);
      if (nodeInFlow && nodeInFlow.position) {
        const { x, y } = nodeInFlow.position;
        // React Flow node width thông thường là ~150px, height ~80px.
        // Căn lề pan vào chính giữa node
        setCenter(x + 75, y + 40, { zoom: 1.3, duration: 800 });
      }
    }
  }, [selectedNode, nodes, setCenter]);

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
        <MiniMap 
          zoomable 
          pannable 
          nodeStrokeColor={(n) => {
            if (n.type === 'documentNode') {
              return n.data.docType === 'NHNN' ? '#1C7293' : '#F0631D';
            }
            return n.data.status === 'active' ? '#2F9E68' : '#C0442C';
          }} 
          nodeColor={(n) => {
            if (n.type === 'documentNode') {
              return n.data.docType === 'NHNN' ? 'rgba(28, 114, 147, 0.25)' : 'rgba(240, 99, 29, 0.25)';
            }
            return n.data.status === 'active' ? 'rgba(47, 158, 104, 0.25)' : 'rgba(192, 68, 44, 0.25)';
          }} 
          nodeStrokeWidth={3}
        />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default GraphCanvas;
