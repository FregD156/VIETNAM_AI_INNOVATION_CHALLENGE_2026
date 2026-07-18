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
    rawNodes = rawData.nodes.map(node => ({
      id: node.id,
      label: node.label || (node.id.startsWith('doc_') ? 'Document' : 'Clause'),
      properties: {
        id: node.id,
        title: node.title || node.name || '',
        text: node.text || node.content || '',
        status: node.status || 'active',
        type: node.type || node.docType || (node.id.startsWith('doc_tt') ? 'NHNN' : 'SHB_Internal'),
        effective_date: node.effective_date || ''
      }
    }));
    
    rawRelationships = rawData.links.map((link, idx) => ({
      id: link.id || `rel_${link.source}_${link.type || 'link'}_${link.target}_${idx}`,
      start: link.source,
      end: link.target,
      type: link.type || 'HAS_CLAUSE'
    }));
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
    const isDoc = node.label === 'Document';
    const props = node.properties || {};
    
    // Vị trí mặc định hoặc tự động nếu không khai báo trước
    const position = nodePositions[node.id] || { 
      x: Math.random() * 500 + 100, 
      y: Math.random() * 500 + 100 
    };

    return {
      id: node.id,
      type: isDoc ? 'documentNode' : 'clauseNode', // Custom node components
      position,
      data: {
        id: props.id || node.id,
        title: props.title || '',
        text: props.text || '',
        status: props.status || 'active', // active | expired
        docType: props.type || 'NHNN',    // NHNN | SHB_Internal
        effective_date: props.effective_date || '',
        rawLabel: node.label
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
    } else if (rel.type === 'CONFLICTS_WITH') {
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
    } else if (rel.type === 'HAS_CLAUSE') {
      strokeColor = 'var(--navy-hairline)'; // Tự động đổi màu trắng mờ ở Dark Mode / xám đậm mờ ở Light Mode
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
