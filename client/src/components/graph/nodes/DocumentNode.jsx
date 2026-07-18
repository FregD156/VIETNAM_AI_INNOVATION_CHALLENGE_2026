import React from 'react';
import { Handle, Position } from 'reactflow';
import './DocumentNode.css';

export const DocumentNode = ({ data }) => {
  const isNhnn = data.docType === 'NHNN';
  
  return (
    <div className="document-node">
      {/* Target handle for incoming relationships */}
      <Handle type="target" position={Position.Top} style={{ background: '#d4af37' }} />
      
      <div className="document-node-header">
        <span className={`document-node-tag ${isNhnn ? 'nhnn' : 'shb'}`}>
          {isNhnn ? 'NHNN' : 'SHB'}
        </span>
        <span className="document-node-date">{data.effective_date}</span>
      </div>
      
      <div className="document-node-title">
        {data.title}
      </div>

      {/* Source handle for outgoing relationships */}
      <Handle type="source" position={Position.Bottom} style={{ background: '#d4af37' }} />
    </div>
  );
};

export default DocumentNode;
