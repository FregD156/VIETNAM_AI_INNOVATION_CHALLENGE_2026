import React from 'react';
import { Handle, Position } from 'reactflow';
import './DocumentNode.css';

export const DocumentNode = ({ data }) => {
  const docType = data.docType || 'SHB';
  
  // Xác định cấu hình giao diện cho 3 phân loại tài liệu lớn
  const getStyleConfig = () => {
    if (docType === 'Luật') {
      return {
        className: 'law-doc',
        label: 'Luật Quốc Hội',
        color: 'var(--sea-blue)',
        initial: 'L'
      };
    } else if (docType === 'NHNN') {
      return {
        className: 'nhnn-doc',
        label: 'Thông tư NHNN',
        color: 'var(--emerald-active)',
        initial: 'T'
      };
    }
    return {
      className: 'shb-doc',
      label: 'Quy chế SHB',
      color: 'var(--orange-signature)',
      initial: 'S'
    };
  };

  const config = getStyleConfig();
  
  return (
    <div className={`document-node-dot ${config.className}`}>
      {/* Target handle bao phủ 100% hình tròn mờ để kết nối chéo tự nhiên */}
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ 
          background: 'transparent', 
          border: 'none', 
          width: '100%', 
          height: '100%', 
          top: 0, 
          left: 0, 
          borderRadius: '50%', 
          transform: 'none', 
          zIndex: 5 
        }} 
      />
      
      <div className="doc-dot-circle" style={{ backgroundColor: config.color }}>
        <span className="doc-dot-initial">{config.initial}</span>
      </div>
      
      <div className="doc-dot-label">
        {data.id || data.title}
      </div>

      {/* Source handle bao phủ 100% hình tròn mờ */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ 
          background: 'transparent', 
          border: 'none', 
          width: '100%', 
          height: '100%', 
          top: 0, 
          left: 0, 
          borderRadius: '50%', 
          transform: 'none', 
          zIndex: 5 
        }} 
      />
    </div>
  );
};

export default DocumentNode;
