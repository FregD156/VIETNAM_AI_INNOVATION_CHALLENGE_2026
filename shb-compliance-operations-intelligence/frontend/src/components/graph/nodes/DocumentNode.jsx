import React from 'react';
import { Handle, Position } from 'reactflow';
import './DocumentNode.css';

export const DocumentNode = ({ data }) => {
  const isNhnn = data.docType === 'NHNN';
  // Đổ màu handle theo cơ quan ban hành: NHNN = Sea Blue, SHB = Orange Brand
  const handleColor = isNhnn ? 'var(--sea-blue)' : 'var(--orange-signature)';
  
  return (
    <div className={`document-node ${isNhnn ? 'nhnn-doc' : 'shb-doc'}`}>
      {/* Target handle for incoming relationships */}
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ background: handleColor, width: 8, height: 8 }} 
      />
      
      <div className="document-node-header">
        <span className={`document-node-tag ${isNhnn ? 'nhnn' : 'shb'}`}>
          {isNhnn ? 'NHNN Regulation' : 'SHB Internal'}
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
        style={{ background: handleColor, width: 8, height: 8 }} 
      />
    </div>
  );
};

export default DocumentNode;
