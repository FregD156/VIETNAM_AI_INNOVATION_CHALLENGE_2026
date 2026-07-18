import React, { useEffect, useState } from 'react';
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

  // Lưu trữ danh sách các Document Node ID đang được mở rộng
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());

  // Tự động mở rộng node cha (nếu nó là Clause) hoặc chính nó (nếu nó là Document) khi có lựa chọn từ bên ngoài
  useEffect(() => {
    if (selectedNode) {
      const nodeId = selectedNode.id;
      if (nodeId.startsWith('doc_')) {
        setExpandedNodeIds(prev => {
          const next = new Set(prev);
          next.add(nodeId);
          return next;
        });
      } else if (nodeId.startsWith('clause_') && graphData) {
        // Tìm Document cha của Clause này và tự động mở rộng nó
        const edge = graphData.edges.find(e => e.target === nodeId && e.source.startsWith('doc_'));
        if (edge) {
          setExpandedNodeIds(prev => {
            const next = new Set(prev);
            next.add(edge.source);
            return next;
          });
        }
      }
    }
  }, [selectedNode, graphData]);

  // Bộ lọc Node và Edge động dựa trên trạng thái expandedNodeIds (Click to Expand/Collapse)
  useEffect(() => {
    if (!graphData) return;

    // 1. Phân loại node hiển thị
    const visibleNodes = graphData.nodes.filter(node => {
      // Document Node luôn hiển thị (Cấp Macro)
      if (node.type === 'documentNode') {
        return true;
      }
      
      // Clause Node chỉ hiển thị nếu Document cha của nó nằm trong danh sách expandedNodeIds (Cấp Micro)
      if (node.type === 'clauseNode') {
        const parentDocEdge = graphData.edges.find(
          e => e.target === node.id && e.source.startsWith('doc_')
        );
        if (parentDocEdge && expandedNodeIds.has(parentDocEdge.source)) {
          return true;
        }
      }
      
      return false;
    }).map(node => {
      // Gán trạng thái expand động vào data của Document Node để hiển thị biểu tượng ▼/▶
      if (node.type === 'documentNode') {
        return {
          ...node,
          data: {
            ...node.data,
            isExpanded: expandedNodeIds.has(node.id)
          }
        };
      }
      return node;
    });

    // 2. Phân loại edge hiển thị (Chỉ vẽ edge nếu cả source và target node đều đang hiển thị)
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    const visibleEdges = graphData.edges.filter(edge => {
      return visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target);
    });

    setNodes(visibleNodes);
    setEdges(visibleEdges);
  }, [graphData, expandedNodeIds, setNodes, setEdges]);

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
        setCenter(x + 75, y + 40, { zoom: 1.3, duration: 800 });
      }
    }
  }, [selectedNode, nodes, setCenter]);

  const handleNodeClick = (event, node) => {
    setSelectedNode(node);

    // Bấm vào Document Node sẽ toggle mở rộng / thu gọn các Clause trực thuộc
    if (node.type === 'documentNode') {
      setExpandedNodeIds(prev => {
        const next = new Set(prev);
        if (next.has(node.id)) {
          next.delete(node.id); // Thu gọn
        } else {
          next.add(node.id);    // Mở rộng
        }
        return next;
      });
    }
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
