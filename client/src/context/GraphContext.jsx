import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import mockGraphData from '../mocks/mockGraphData.json';
import { parseNeo4jToReactFlow } from '../utils/graphParser';

const GraphContext = createContext(null);

export const GraphProvider = ({ children }) => {
  const [rawData, setRawData] = useState(mockGraphData);

  // Tải dữ liệu đồ thị thực tế từ backend FastAPI khi mount
  useEffect(() => {
    const fetchRealGraphData = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 
          (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:8000'
            : 'https://api.compliance.shb.com.vn');
            
        const response = await fetch(`${baseUrl}/graph`);
        if (response.ok) {
          const data = await response.json();
          if (data && (data.nodes || data.rawNodes)) {
            setRawData(data);
          }
        }
      } catch (error) {
        console.warn('Không thể kết nối API đồ thị thật, tự động dùng mock data dự phòng:', error);
      }
    };
    fetchRealGraphData();
  }, []);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    shb: false,
    nhnn: false,
    active: false,
    expired: false
  });

  // Toggle filter
  const toggleFilter = useCallback((filterKey) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  }, []);

  // Xóa toàn bộ bộ lọc màu
  const clearFilters = useCallback(() => {
    setActiveFilters({
      shb: false,
      nhnn: false,
      active: false,
      expired: false
    });
  }, []);

  // Lọc và highlight đồ thị dựa trên searchQuery và activeFilters
  useEffect(() => {
    const parsed = parseNeo4jToReactFlow(rawData);
    
    const isDocTypeSelected = activeFilters.shb || activeFilters.nhnn;
    const isStatusSelected = activeFilters.active || activeFilters.expired;
    const hasSearch = searchQuery.trim() !== '';
    const hasActiveFilters = isDocTypeSelected || isStatusSelected || hasSearch;
    
    if (!hasActiveFilters) {
      setGraphData(parsed);
      return;
    }
    
    const highlightedNodeIds = new Set();
    
    const updatedNodes = parsed.nodes.map(node => {
      // 1. Kiểm tra nhóm Loại tài liệu
      let matchDocType = true;
      if (isDocTypeSelected) {
        const isSHB = node.data.docType === 'SHB' || node.data.docType === 'SHB_Internal' || node.id.includes('shb') || node.id.includes('qd') || node.id.includes('tietkiem');
        const isNHNN = node.data.docType === 'NHNN' || node.id.includes('tt');
        
        matchDocType = (activeFilters.shb && isSHB) || (activeFilters.nhnn && isNHNN);
      }

      // 2. Kiểm tra nhóm Hiệu lực
      let matchStatus = true;
      if (isStatusSelected) {
        const status = node.data.status;
        matchStatus = (activeFilters.active && status === 'active') || (activeFilters.expired && status === 'expired');
      }

      // 3. Kiểm tra Ô Tìm kiếm
      let matchSearch = true;
      if (hasSearch) {
        const q = searchQuery.toLowerCase().trim();
        if (q === ':active') {
          matchSearch = node.data.status === 'active';
        } else if (q === ':expired') {
          matchSearch = node.data.status === 'expired';
        } else if (q === ':shb') {
          matchSearch = node.data.docType === 'SHB' || node.id.includes('shb') || node.id.includes('qd') || node.id.includes('tietkiem');
        } else if (q === ':nhnn') {
          matchSearch = node.data.docType === 'NHNN' || node.id.includes('tt');
        } else {
          const title = (node.data.title || '').toLowerCase();
          const text = (node.data.content || node.data.text || '').toLowerCase();
          matchSearch = title.includes(q) || text.includes(q);
        }
      }

      const isHighlighted = matchDocType && matchStatus && matchSearch;
      if (isHighlighted) {
        highlightedNodeIds.add(node.id);
      }

      return {
        ...node,
        style: {
          ...node.style,
          opacity: isHighlighted ? 1 : 0.15,
          border: isHighlighted ? '2px solid var(--orange-signature)' : 'none',
          boxShadow: isHighlighted ? '0 0 15px rgba(240, 99, 29, 0.4)' : 'none'
        }
      };
    });

    // Làm mờ các edges nếu một trong hai đầu node bị mờ
    const updatedEdges = parsed.edges.map(edge => {
      const sourceHighlighted = highlightedNodeIds.has(edge.source);
      const targetHighlighted = highlightedNodeIds.has(edge.target);
      const isHighlighted = sourceHighlighted && targetHighlighted;
      
      return {
        ...edge,
        style: {
          ...edge.style,
          opacity: isHighlighted ? 1 : 0.15
        }
      };
    });

    setGraphData({ nodes: updatedNodes, edges: updatedEdges });
  }, [rawData, searchQuery, activeFilters]);

  // Thực hiện tìm kiếm và highlight các Node khớp trên Canvas
  const searchGraph = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Thêm một node mới động (phục vụ tính năng phê duyệt tài liệu của Admin)
  const addNodeAndRelationships = useCallback((newNode, newRels) => {
    setRawData(prev => {
      const updatedNodes = [...prev.rawNodes];
      // Tránh trùng ID
      if (!updatedNodes.some(n => n.id === newNode.id)) {
        updatedNodes.push(newNode);
      }

      const updatedRels = [...prev.rawRelationships];
      newRels.forEach(rel => {
        if (!updatedRels.some(r => r.id === rel.id)) {
          updatedRels.push(rel);
        }
      });

      return {
        rawNodes: updatedNodes,
        rawRelationships: updatedRels
      };
    });
  }, []);

  // State phân chia Đồ thị đa tầng: Macro (Tổng quan văn bản) và Micro (Chi tiết Điều Khoản con)
  const [viewMode, setViewMode] = useState('macro'); // 'macro' | 'micro'
  const [activeDocId, setActiveDocId] = useState(null);

  return (
    <GraphContext.Provider value={{
      graphData,
      selectedNode,
      searchQuery,
      activeFilters,
      viewMode,
      setViewMode,
      activeDocId,
      setActiveDocId,
      setSelectedNode,
      setSearchQuery,
      searchGraph,
      toggleFilter,
      clearFilters,
      addNodeAndRelationships
    }}>
      {children}
    </GraphContext.Provider>
  );
};

export const useGraphContext = () => {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error('useGraphContext must be used within a GraphProvider');
  }
  return context;
};
