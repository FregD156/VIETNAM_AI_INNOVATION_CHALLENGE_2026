/**
 * graphParser.js
 * Chuyển đổi dữ liệu thô từ Neo4j/Mock CSDL sang định dạng nodes và edges của React Flow
 */

export const parseNeo4jToReactFlow = (rawData) => {
  if (!rawData) {
    return { nodes: [], edges: [] };
  }

  // 1. Phân biệt định dạng mock và định dạng API NetworkX thật từ FastAPI
  let rawNodes = [];
  let rawRelationships = [];

  if (rawData.rawNodes && rawData.rawRelationships) {
    // Định dạng Mock
    rawNodes = rawData.rawNodes;
    rawRelationships = rawData.rawRelationships;
  } else if (rawData.nodes && rawData.links) {
    // Định dạng API NetworkX thật từ FastAPI
    rawNodes = rawData.nodes.map(node => {
      const nodeId = node.id || '';
      const props = node.properties || {};
      const docNum = props.doc_num || node.doc_num || nodeId;
      
      // Phân loại nguồn ban hành động chuẩn dữ liệu mới
      let docType = 'SHB';
      if (docNum.toLowerCase().startsWith('law-') || docNum.toUpperCase().includes('QH')) {
        docType = 'Luật';
      } else if (docNum.toUpperCase().includes('TT-NHNN') || docNum.includes('39/2016') || docNum.includes('17/2024') || docNum.includes('06/2023')) {
        docType = 'NHNN';
      }
      
      return {
        id: nodeId,
        label: node.label || (nodeId.startsWith('doc_') ? 'Document' : 'Clause'),
        nodeType: node.type || (nodeId.startsWith('doc_') ? 'document' : 'clause'),
        properties: {
          id: nodeId,
          title: node.title || node.name || props.title || '',
          text: node.content || node.text || props.text || '',
          status: node.status || props.status || 'Còn hiệu lực',
          type: docType,
          effective_date: node.effective_date || props.effective_date || ''
        }
      };
    });
    
    rawRelationships = rawData.links.map((link, idx) => {
      let sourceId = link.source;
      let targetId = link.target;
      
      // Nếu source là số (chỉ số index trong mảng nodes từ NetworkX)
      if (typeof link.source === 'number' && rawData.nodes[link.source]) {
        sourceId = rawData.nodes[link.source].id;
      }
      
      // Nếu target là số (chỉ số index trong mảng nodes từ NetworkX)
      if (typeof link.target === 'number' && rawData.nodes[link.target]) {
        targetId = rawData.nodes[link.target].id;
      }
      
      return {
        id: link.id || `rel_${sourceId}_${link.type || 'link'}_${targetId}_${idx}`,
        start: sourceId,
        end: targetId,
        type: link.type || 'HAS_CLAUSE'
      };
    });
  } else {
    return { nodes: [], edges: [] };
  }

  // Cấu hình vị trí mặc định cho các Node để tạo giao diện đẹp mắt, tránh chồng chéo
  const nodePositions = {
    // Thông tư 39 & Clause
    doc_tt39: { x: 100, y: 100 },
    clause_5_tt39: { x: 100, y: 250 },
    
    // Thông tư 06 & Clause
    doc_tt06: { x: 400, y: 100 },
    clause_5_tt06: { x: 400, y: 250 },
    
    // Quyết định 214 & Clause
    doc_qd214: { x: 700, y: 100 },
    clause_14_qd214: { x: 700, y: 250 },
    
    // Thông tư 16 & Clause
    doc_tt16: { x: 250, y: 450 },
    clause_12_tt16: { x: 250, y: 600 },
    
    // Quyết định 104 & Clause
    doc_qd104: { x: 550, y: 450 },
    clause_9_qd104: { x: 550, y: 600 },
    
    // Quy chế Tiết kiệm & Clause
    doc_qd_tietkiem: { x: 850, y: 450 },
    clause_5_qd_tietkiem: { x: 850, y: 600 }
  };

  // 1. Chuyển đổi Nodes
  const nodes = rawNodes.map((node) => {
    const isDoc = node.nodeType === 'document' || node.label === 'Document';
    const props = node.properties || {};
    
    // Vị trí mặc định hoặc tự động nếu không khai báo trước
    const position = nodePositions[node.id] || { 
      x: Math.random() * 500 + 100, 
      y: Math.random() * 500 + 100 
    };

    // Phân loại nguồn ban hành chuẩn dữ liệu mới
    let docType = props.type || 'SHB';
    const docNum = props.doc_num || node.id || '';
    if (docNum.toLowerCase().startsWith('law-') || docNum.toUpperCase().includes('QH') || docType === 'Luật') {
      docType = 'Luật';
    } else if (docNum.toUpperCase().includes('TT-NHNN') || docNum.includes('39/2016') || docNum.includes('17/2024') || docNum.includes('06/2023') || docType === 'NHNN') {
      docType = 'NHNN';
    } else {
      docType = 'SHB';
    }

    return {
      id: node.id,
      type: isDoc ? 'documentNode' : 'clauseNode', // Custom node components
      position,
      data: {
        id: props.id || node.id,
        title: props.title || '',
        text: props.text || '',
        status: props.status || 'Còn hiệu lực', 
        docType: docType,    // Luật | NHNN | SHB
        effective_date: props.effective_date || '',
        rawLabel: isDoc ? 'Document' : 'Clause'
      }
    };
  });

  // 2. Chuyển đổi Edges
  const edges = rawRelationships.map((rel) => {
    let strokeColor = '#64748b'; // Mặc định xám
    let animated = false;
    let strokeWidth = 1.5;
    let label = rel.type;

    // Thiết lập màu và hiệu ứng cho từng mối quan hệ đặc thù sử dụng các biến CSS
    if (rel.type === 'SUPERSEDES') {
      strokeColor = 'var(--brick-expired)'; // Đỏ gạch thay thế
      animated = true;
      strokeWidth = 2;
      label = 'THAY THẾ (Supersedes)';
    } else if (rel.type === 'CONFLICTS_WITH' || rel.type === 'CONFLICTS') {
      strokeColor = 'var(--brick-expired)'; // Đỏ gạch xung đột
      animated = true;
      strokeWidth = 2.5;
      label = 'XUNG ĐỘT (Conflicts)';
    } else if (rel.type === 'REFERENCES') {
      strokeColor = 'var(--sea-blue)'; // Xanh dẫn chiếu
      strokeWidth = 1.8;
      label = 'DẪN CHIẾU (References)';
    } else if (rel.type === 'AMENDS') {
      strokeColor = 'var(--emerald-active)'; // Xanh lá sửa đổi
      strokeWidth = 1.8;
      label = 'SỬA ĐỔI (Amends)';
    } else if (rel.type === 'contains' || rel.type === 'HAS_CLAUSE') {
      strokeColor = 'rgba(255, 255, 255, 0.35)'; // Màu trắng sữa mờ rõ nét, không dùng --navy-hairline quá mờ
      strokeWidth = 1.2;
      label = '';
    }

    return {
      id: rel.id,
      source: rel.start,
      target: rel.end,
      animated,
      label,
      type: 'smoothstep',
      style: {
        stroke: strokeColor,
        strokeWidth
      },
      labelStyle: {
        fill: 'var(--text-muted)',
        fontSize: '9px',
        fontWeight: 'bold'
      }
    };
  });

  return { nodes, edges };
};
