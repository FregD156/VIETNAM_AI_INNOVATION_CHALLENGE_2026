import React from 'react';
import { Handle, Position } from 'reactflow';
import './DocumentNode.css';

export const DocumentNode = ({ data }) => {
  const docType = data.docType || 'SHB';
  
  // Xác định cấu hình giao diện cho 3 phân loại tài liệu
  const getStyleConfig = () => {
    if (docType === 'Luật') {
      return {
        className: 'law-doc',
        tagClass: 'law',
        label: 'Luật Quốc Hội',
        color: 'var(--sea-blue)'
      };
    } else if (docType === 'NHNN') {
      return {
        className: 'nhnn-doc',
        tagClass: 'nhnn',
        label: 'Thông tư NHNN',
        color: 'var(--emerald-active)'
      };
    }
    return {
      className: 'shb-doc',
      tagClass: 'shb',
      label: 'Quy chế SHB',
      color: 'var(--orange-signature)'
    };
  };

  const config = getStyleConfig();
  
  return (
    <div className={`document-node ${config.className}`}>
      {/* Target handle for incoming relationships */}
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ background: config.color, width: 8, height: 8 }} 
      />
      
      <div className="document-node-header">
        <span className={`document-node-tag ${config.tagClass}`}>
          {config.label} {data.isExpanded ? '▼' : '▶'}
        </span>
        <span className="document-node-date monospace">{data.effective_date}</span>
      </div>
      
      <div className="document-node-title">
        {data.title}
      </div>

      {/* Source handle for outgoing relationships */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ background: config.color, width: 8, height: 8 }} 
      />
    </div>
  );
};

export default DocumentNode;
