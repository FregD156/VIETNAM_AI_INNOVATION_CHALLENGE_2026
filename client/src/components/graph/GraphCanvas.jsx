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
import { LuMaximize, LuArrowLeft } from 'react-icons/lu';

import 'reactflow/dist/style.css';
import './GraphCanvas.css';

// Đăng ký các component Node tùy chỉnh trong React Flow
const nodeTypes = {
  documentNode: DocumentNode,
  clauseNode: ClauseNode
};

export const GraphCanvas = () => {
  const { 
    graphData, 
    selectedNode, 
    setSelectedNode,
    viewMode,
    setViewMode,
    activeDocId,
    setActiveDocId
  } = useGraphData();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layoutMode, setLayoutMode] = useState('original'); // 'original' | 'lr' | 'snowflake' | 'grid'
  
  const { setCenter, fitView } = useReactFlow();

  // Quay về vị trí trung tâm và tự động reset độ thu phóng cho vừa vặn canvas
  const handleResetView = () => {
    fitView({ duration: 800, padding: 0.25 });
  };

  // Thuật toán sắp xếp toạ độ các Node động theo bố cục lựa chọn (Nén khoảng cách nhỏ gọn hơn)
  const applyLayoutAlgorithms = (nodesList, edgesList, mode) => {
    const docNodes = nodesList.filter(n => n.type === 'documentNode');
    
    if (mode === 'lr') {
      // Bố cục Trái -> Phải (Phân tầng từ văn bản gốc sang các điều khoản con - 2 Cột song song)
      let currentY = 50;
      docNodes.forEach((doc) => {
        const children = nodesList.filter(n => {
          if (n.id === doc.id) return false;
          return edgesList.some(e => e.target === n.id && (e.source === doc.id || e.source.startsWith(doc.id + '|')));
        });
        
        const cols = 2;
        const rowCount = Math.ceil(children.length / cols) || 1;
        const groupHeight = Math.max(100, rowCount * 75);
        
        doc.position = { x: 50, y: currentY + (groupHeight / 2) - 30 };
        
        children.forEach((child, childIdx) => {
          const row = Math.floor(childIdx / cols);
          const col = childIdx % cols;
          child.position = {
            x: 350 + col * 240,
            y: currentY + row * 75
          };
        });
        
        currentY += groupHeight + 80;
      });
    } else if (mode === 'snowflake') {
      // Bố cục Bông tuyết (Tài liệu gốc ở tâm, các điều khoản tỏa tròn xung quanh)
      docNodes.forEach((doc, idx) => {
        const center = { 
          x: 250 + (idx % 3) * 480,
          y: 200 + Math.floor(idx / 3) * 440
        };
        doc.position = center;
        
        const children = nodesList.filter(n => {
          if (n.id === doc.id) return false;
          return edgesList.some(e => e.target === n.id && (e.source === doc.id || e.source.startsWith(doc.id + '|')));
        });
        
        const count = children.length;
        const radius = 150;
        children.forEach((child, childIdx) => {
          const angle = (childIdx * 2 * Math.PI) / (count || 1);
          child.position = {
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle)
          };
        });
      });
    } else if (mode === 'grid') {
      // Bố cục Dàn lưới gọn gàng
      let startY = 50;
      docNodes.forEach((doc) => {
        const children = nodesList.filter(n => {
          if (n.id === doc.id) return false;
          return edgesList.some(e => e.target === n.id && (e.source === doc.id || e.source.startsWith(doc.id + '|')));
        });
        
        const cols = 3;
        const rowCount = Math.ceil(children.length / cols) || 1;
        const groupHeight = rowCount * 75;
        
        doc.position = { x: 50, y: startY + (groupHeight / 2) - 20 };
        
        children.forEach((child, childIdx) => {
          const row = Math.floor(childIdx / cols);
          const col = childIdx % cols;
          child.position = {
            x: 350 + col * 240,
            y: startY + row * 75
          };
        });
        
        startY += groupHeight + 80;
      });
    }
  };

  // Bộ lọc Node và Edge động dựa trên ViewMode và ActiveDocId (Macro/Micro View)
  useEffect(() => {
    if (!graphData || !graphData.nodes) return;

    let visibleNodes = [];
    let visibleEdges = [];

    if (viewMode === 'macro') {
      // 1. CHẾ ĐỘ TỔNG QUAN (MACRO): Chỉ hiển thị các Document Node lớn
      visibleNodes = graphData.nodes.filter(node => node.type === 'documentNode');
      const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
      
      // Chỉ hiển thị các Edge sửa đổi/thay thế/dẫn chiếu giữa các Document lớn với nhau
      visibleEdges = graphData.edges.filter(edge => 
        visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
      );

      // Bố cục Circle Layout mặc định cho Macro view để các văn bản lớn nối tròn đều đẹp mắt
      if (layoutMode === 'original') {
        const radius = 220;
        const centerX = 380;
        const centerY = 280;
        visibleNodes.forEach((node, idx) => {
          const angle = (idx / visibleNodes.length) * 2 * Math.PI;
          node.position = {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
          };
        });
      } else {
        applyLayoutAlgorithms(visibleNodes, visibleEdges, layoutMode);
      }
    } else {
      // 2. CHẾ ĐỘ CHI TIẾT VĂN BẢN (MICRO): Drill-down cấu trúc cụ thể của activeDocId
      const rootDocNode = graphData.nodes.find(n => n.id === activeDocId);
      if (rootDocNode) {
        visibleNodes.push(rootDocNode);
      }

      // Thuật toán BFS tìm toàn bộ các node con (Điều/Khoản) trực thuộc Document gốc
      const queue = [activeDocId];
      const visited = new Set([activeDocId]);
      const childNodeIds = new Set();
      
      while (queue.length > 0) {
        const currentId = queue.shift();
        
        // Quét tìm các liên kết chứa cấu trúc của node hiện tại
        const childEdges = graphData.edges.filter(e => 
          e.source === currentId && (e.data?.relationType === 'contains' || e.data?.relationType === 'HAS_CLAUSE')
        );
        
        childEdges.forEach(e => {
          if (!visited.has(e.target)) {
            visited.add(e.target);
            queue.push(e.target);
            childNodeIds.add(e.target);
            
            const childNode = graphData.nodes.find(n => n.id === e.target);
            if (childNode) {
              visibleNodes.push(childNode);
            }
          }
        });
      }

      const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
      
      // Chỉ vẽ edge kết nối giữa các node đang hiển thị
      visibleEdges = graphData.edges.filter(edge => 
        visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
      );

      // Sắp xếp dạng Cây Phân Cấp Trái -> Phải (Left-to-Right tree hierarchy) tuyệt đẹp
      if (layoutMode === 'original') {
        // Cột 1: Document gốc (X = 50, Y = Center)
        // Cột 2: Các Article/Điều (X = 300, Y phân bố dọc)
        // Cột 3: Các Clause/Khoản con (X = 550, Y phân bố dọc dưới từng Điều tương ứng)
        
        const articleEdges = visibleEdges.filter(e => e.source === activeDocId);
        const articleNodes = articleEdges
          .map(e => visibleNodes.find(n => n.id === e.target))
          .filter(Boolean);
        
        let currentY = 50;
        const X_STEP = 120;
        const Y_STEP = 35;
        
        if (rootDocNode) {
          rootDocNode.position = { 
            x: 50, 
            y: Math.max(100, (articleNodes.length * Y_STEP) / 2) 
          };
        }
        
        articleNodes.forEach((art) => {
          // Tìm các Khoản con trực thuộc Điều
          const clauseEdges = visibleEdges.filter(e => e.source === art.id);
          const clauseNodes = clauseEdges
            .map(e => visibleNodes.find(n => n.id === e.target))
            .filter(Boolean);
          
          // Định vị cho Điều
          art.position = { 
            x: 50 + X_STEP, 
            y: currentY + (Math.max(1, clauseNodes.length) - 1) * Y_STEP / 2 
          };
          
          // Định vị cho các Khoản
          clauseNodes.forEach((cl) => {
            cl.position = { x: 50 + X_STEP * 2, y: currentY };
            currentY += Y_STEP;
          });
          
          if (clauseNodes.length === 0) {
            currentY += Y_STEP;
          }
          
          currentY += 20; // Giãn cách giữa các nhóm Điều
        });
      } else {
        applyLayoutAlgorithms(visibleNodes, visibleEdges, layoutMode);
      }
    }

    // 3. Áp dụng Highlight kết nối khi có Node được chọn
    let finalNodes = [...visibleNodes];
    let finalEdges = [...visibleEdges];

    if (selectedNode) {
      const selectedId = selectedNode.id;
      const connectedEdgeIds = new Set();
      const connectedNodeIds = new Set([selectedId]);

      visibleEdges.forEach(edge => {
        if (edge.source === selectedId || edge.target === selectedId) {
          connectedEdgeIds.add(edge.id);
          connectedNodeIds.add(edge.source);
          connectedNodeIds.add(edge.target);
        }
      });

      finalNodes = visibleNodes.map(node => {
        const isConnected = connectedNodeIds.has(node.id);
        const isSelf = node.id === selectedId;
        
        return {
          ...node,
          data: {
            ...node.data,
            isExpanded: viewMode === 'micro' && activeDocId === node.id
          },
          style: {
            ...node.style,
            opacity: 1, // Giữ nguyên độ sáng 100% cho mọi node
            transition: 'opacity 0.25s ease, transform 0.25s ease',
            border: isSelf 
              ? '2px solid var(--orange-signature)' 
              : (isConnected ? '1.5px solid var(--orange-ember)' : 'none'),
            boxShadow: isSelf 
              ? '0 0 15px var(--orange-signature)' 
              : (isConnected ? '0 0 8px rgba(255, 171, 107, 0.4)' : 'none')
          }
        };
      });

      finalEdges = visibleEdges.map(edge => {
        const isConnected = connectedEdgeIds.has(edge.id);
        return {
          ...edge,
          animated: isConnected, // Chạy hoạt họa cho kết nối
          style: {
            ...edge.style,
            opacity: 1, // Giữ nguyên độ sáng 100% cho mọi edge
            strokeWidth: isConnected ? 3.5 : (edge.style?.strokeWidth || 1.2),
            stroke: isConnected ? 'var(--orange-signature)' : (edge.style?.stroke || '#64748b'),
            filter: isConnected ? 'drop-shadow(0 0 6px var(--orange-signature))' : 'none', // Hiệu ứng phát sáng neon rực rỡ
            transition: 'all 0.25s ease'
          }
        };
      });
    } else {
      finalNodes = visibleNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          isExpanded: viewMode === 'micro' && activeDocId === node.id
        },
        style: {
          ...node.style,
          opacity: 1,
          border: 'none',
          boxShadow: 'none',
          transition: 'opacity 0.25s ease'
        }
      }));

      finalEdges = visibleEdges.map(edge => ({
        ...edge,
        animated: false,
        style: {
          ...edge.style,
          opacity: 1,
          strokeWidth: edge.style?.strokeWidth || 1.2,
          stroke: edge.style?.stroke || '#64748b',
          transition: 'opacity 0.25s ease'
        }
      }));
    }

    setNodes(finalNodes);
    setEdges(finalEdges);
  }, [graphData, viewMode, activeDocId, layoutMode, selectedNode, setNodes, setEdges]);

  // Lắng nghe sự kiện focus node từ bên ngoài (như click CitationTag trong Chat)
  useEffect(() => {
    const handleFocusNode = (e) => {
      const nodeId = e.detail;
      if (!nodeId || !graphData || !graphData.nodes) return;
      
      const targetNode = graphData.nodes.find(n => n.id === nodeId);
      if (targetNode) {
        // Tự động chuyển sang chế độ drill-down Micro của Document cha
        if (targetNode.type === 'clauseNode') {
          const parentEdge = graphData.edges.find(edge => 
            edge.target === nodeId && (edge.type === 'contains' || edge.type === 'HAS_CLAUSE')
          );
          if (parentEdge) {
            setActiveDocId(parentEdge.source);
            setViewMode('micro');
          } else if (nodeId.includes('|')) {
            setActiveDocId(nodeId.split('|')[0]);
            setViewMode('micro');
          }
        } else if (targetNode.type === 'documentNode') {
          setActiveDocId(targetNode.id);
          setViewMode('micro');
        }
        setSelectedNode(targetNode);
      }
    };

    window.addEventListener('focus-graph-node', handleFocusNode);
    return () => window.removeEventListener('focus-graph-node', handleFocusNode);
  }, [graphData, setSelectedNode, setViewMode, setActiveDocId]);

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
  };

  const handleNodeDoubleClick = (event, node) => {
    if (node.type === 'documentNode') {
      setActiveDocId(node.id);
      setViewMode('micro');
      // Tự động căn chỉnh màn hình cho vừa vặn các node con mới xuất hiện
      setTimeout(() => {
        fitView({ duration: 800, padding: 0.2 });
      }, 100);
    }
  };

  const handlePaneClick = () => {
    setSelectedNode(null);
  };

  return (
    <div className="graph-canvas-container">
      {/* Sắp xếp bố cục đồ thị Toolbar */}
      <div className="graph-layout-toolbar panel">
        {viewMode === 'micro' && (
          <>
            <button 
              className="btn-layout-option back-to-macro-btn"
              onClick={() => {
                setViewMode('macro');
                setActiveDocId(null);
                setSelectedNode(null);
                setTimeout(() => {
                  fitView({ duration: 800, padding: 0.25 });
                }, 100);
              }}
              title="Quay lại tổng quan văn bản"
            >
              <LuArrowLeft className="back-view-icon" /> Quay lại
            </button>
            <div className="toolbar-divider" />
          </>
        )}
        <span className="toolbar-label">
          {viewMode === 'macro' ? 'Bố cục (Tổng quan):' : 'Bố cục (Chi tiết):'}
        </span>
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
        <div className="toolbar-divider" />
        <button 
          className="btn-layout-option reset-view-btn" 
          onClick={handleResetView}
          title="Quay về trung tâm và reset độ thu phóng"
        >
          <LuMaximize className="reset-view-icon" /> Reset
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
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
            return (status === 'Còn hiệu lực' || status === 'active' || status === 'Còn hiệu lực một phần') ? '#2F9E68' : '#C0442C';
          }} 
          nodeColor={(n) => {
            if (n.type === 'documentNode') {
              const docType = n.data.docType || 'SHB';
              if (docType === 'Luật') return 'rgba(28, 114, 147, 0.25)';
              if (docType === 'NHNN') return 'rgba(47, 158, 104, 0.25)';
              return 'rgba(240, 99, 29, 0.25)';
            }
            const status = n.data.status || 'Còn hiệu lực';
            return (status === 'Còn hiệu lực' || status === 'active' || status === 'Còn hiệu lực một phần') ? 'rgba(47, 158, 104, 0.25)' : 'rgba(192, 68, 44, 0.25)';
          }} 
          nodeStrokeWidth={3}
        />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>

      {viewMode === 'macro' && (
        <div className="graph-instructions-overlay panel">
          <span>💡 Nhấp đúp (Double-click) vào một văn bản để khoan sâu (drill-down) xem chi tiết Điều & Khoản.</span>
        </div>
      )}
    </div>
  );
};

export default GraphCanvas;
