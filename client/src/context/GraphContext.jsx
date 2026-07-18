import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import mockGraphData from '../mocks/mockGraphData.json';
import { parseNeo4jToReactFlow } from '../utils/graphParser';

const GraphContext = createContext(null);

export const GraphProvider = ({ children }) => {
  const [rawData, setRawData] = useState(mockGraphData);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Nạp và phân tích dữ liệu đồ thị khi mount
  useEffect(() => {
    const parsed = parseNeo4jToReactFlow(rawData);
    setGraphData(parsed);
  }, [rawData]);

  // Thực hiện tìm kiếm và highlight các Node khớp trên Canvas
  const searchGraph = useCallback((query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      // Nếu rỗng, khôi phục màu sắc mặc định
      const parsed = parseNeo4jToReactFlow(rawData);
      setGraphData(parsed);
      return;
    }

    const q = query.toLowerCase();
    setGraphData(prev => {
      const updatedNodes = prev.nodes.map(node => {
        const title = node.data.title.toLowerCase();
        const text = node.data.text.toLowerCase();
        const isMatched = title.includes(q) || text.includes(q);
        
        return {
          ...node,
          style: {
            ...node.style,
            opacity: isMatched ? 1 : 0.25,
            border: isMatched ? '2px solid var(--color-accent-gold)' : 'none',
            boxShadow: isMatched ? '0 0 15px var(--color-accent-gold)' : 'none'
          }
        };
      });

      return {
        ...prev,
        nodes: updatedNodes
      };
    });
  }, [rawData]);

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

  return (
    <GraphContext.Provider value={{
      graphData,
      selectedNode,
      searchQuery,
      setSelectedNode,
      setSearchQuery,
      searchGraph,
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
