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
  const [layoutMode, setLayoutMode] = useState('original'); // 'original' | 'lr' | 'snowflake' | 'grid'
  
  const { setCenter } = useReactFlow();

  // Lưu trữ danh sách các Document Node ID đang được mở rộng
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());

  // Thuật toán sắp xếp toạ độ các Node động theo bố cục lựa chọn
  const applyLayoutAlgorithms = (nodesList, edgesList, mode) => {
    const docNodes = nodesList.filter(n => n.type === 'documentNode');
    
    if (mode === 'lr') {
      // Bố cục Trái -> Phải (Phân tầng từ văn bản gốc sang các điều khoản con - 2 Cột song song để tránh bị dài dòng)
      let currentY = 100;
      docNodes.forEach((doc) => {
        const children = nodesList.filter(n => {
          if (n.id === doc.id) return false;
          return edgesList.some(e => e.target === n.id && (e.source === doc.id || e.source.startsWith(doc.id + '|')));
        });
        
        const cols = 2;
        const rowCount = Math.ceil(children.length / cols) || 1;
        const groupHeight = Math.max(120, rowCount * 110);
        
        // Căn giữa Document node theo chiều dọc của cụm Clause con
        doc.position = { x: 100, y: currentY + (groupHeight / 2) - 40 };
        
        children.forEach((child, childIdx) => {
          const row = Math.floor(childIdx / cols);
          const col = childIdx % cols;
          child.position = {
            x: 460 + col * 320, // Cột 1: 460, Cột 2: 780
            y: currentY + row * 110
          };
        });
        
        // Cộng dồn Y lũy kế cho văn bản tiếp theo kèm khoảng cách an toàn 120px
        currentY += groupHeight + 120;
      });
    } else if (mode === 'snowflake') {
      // Bố cục Bông tuyết (Quy chế gốc ở tâm, các điều khoản tỏa tròn xung quanh - Tính toán tâm động chia 2 cột chính)
      docNodes.forEach((doc, idx) => {
        const center = { 
          x: 500 + (idx % 2) * 1000, 
          y: 400 + Math.floor(idx / 2) * 900 
        };
        doc.position = center;
        
        const children = nodesList.filter(n => {
          if (n.id === doc.id) return false;
          return edgesList.some(e => e.target === n.id && (e.source === doc.id || e.source.startsWith(doc.id + '|')));
        });
        
        const count = children.length;
        const radius = 280; // Bán kính tỏa tròn an toàn không chồng lấn
        children.forEach((child, childIdx) => {
          const angle = (childIdx * 2 * Math.PI) / (count || 1);
          child.position = {
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle)
          };
        });
      });
    } else if (mode === 'grid') {
      // Bố cục Dàn lưới gọn gàng (Xếp theo cụm lưới chữ nhật 3 cột tương ứng từng văn bản, giãn cách dọc lũy kế)
      let startY = 100;
      docNodes.forEach((doc) => {
        const children = nodesList.filter(n => {
          if (n.id === doc.id) return false;
          return edgesList.some(e => e.target === n.id && (e.source === doc.id || e.source.startsWith(doc.id + '|')));
        });
        
        const cols = 3;
        const rowCount = Math.ceil(children.length / cols) || 1;
        const groupHeight = rowCount * 110;
        
        // Căn giữa Document node theo chiều dọc của lưới con
        doc.position = { x: 100, y: startY + (groupHeight / 2) - 20 };
        
        children.forEach((child, childIdx) => {
          const row = Math.floor(childIdx / cols);
          const col = childIdx % cols;
          child.position = {
            x: 460 + col * 300, // Chia 3 cột giãn cách rộng rãi
            y: startY + row * 110
          };
        });
        
        startY += groupHeight + 120;
      });
    }
  };

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

    // 3. Áp dụng sắp xếp bố cục đồ thị động nếu có cấu hình
    if (layoutMode !== 'original') {
      applyLayoutAlgorithms(visibleNodes, visibleEdges, layoutMode);
    }

    setNodes(visibleNodes);
    setEdges(visibleEdges);
  }, [graphData, expandedNodeIds, layoutMode, setNodes, setEdges]);

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
      {/* Sắp xếp bố cục đồ thị Toolbar */}
      <div className="graph-layout-toolbar panel">
        <span className="toolbar-label">Bố cục:</span>
        <button 
          className={`btn-layout-option ${layoutMode === 'original' ? 'active' : ''}`} 
          onClick={() => setLayoutMode('original')}
        >
          Mặc định
        </button>
        <button 
          className={`btn-layout-option ${layoutMode === 'lr' ? 'active' : ''}`} 
          onClick={() => setLayoutMode('lr')}
        >
          Trái → Phải
        </button>
        <button 
          className={`btn-layout-option ${layoutMode === 'snowflake' ? 'active' : ''}`} 
          onClick={() => setLayoutMode('snowflake')}
        >
          Bông tuyết
        </button>
        <button 
          className={`btn-layout-option ${layoutMode === 'grid' ? 'active' : ''}`} 
          onClick={() => setLayoutMode('grid')}
        >
          Gọn gàng
        </button>
      </div>

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
              const docType = n.data.docType || 'SHB';
              if (docType === 'Luật') return '#1C7293';
              if (docType === 'NHNN') return '#2F9E68';
              return '#F0631D';
            }
            const status = n.data.status || 'Còn hiệu lực';
            return (status === 'Còn hiệu lực' || status === 'active') ? '#2F9E68' : '#C0442C';
          }} 
          nodeColor={(n) => {
            if (n.type === 'documentNode') {
              const docType = n.data.docType || 'SHB';
              if (docType === 'Luật') return 'rgba(28, 114, 147, 0.25)';
              if (docType === 'NHNN') return 'rgba(47, 158, 104, 0.25)';
              return 'rgba(240, 99, 29, 0.25)';
            }
            const status = n.data.status || 'Còn hiệu lực';
            return (status === 'Còn hiệu lực' || status === 'active') ? 'rgba(47, 158, 104, 0.25)' : 'rgba(192, 68, 44, 0.25)';
          }} 
          nodeStrokeWidth={3}
        />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default GraphCanvas;
