import React from 'react';
import { Handle, Position } from 'reactflow';
import './ClauseNode.css';

export const ClauseNode = ({ data }) => {
  const isActive = data.status === 'active';
  
  return (
    <div className={`clause-node ${isActive ? 'active' : 'expired'}`}>
      {/* Target handle */}
      <Handle type="target" position={Position.Top} style={{ background: isActive ? '#10b981' : '#ef4444' }} />
      
      <div className="clause-node-header">
        <span className="clause-status-tag">
          {isActive ? 'Hiệu lực' : 'Hết hạn'}
        </span>
      </div>
      
      <div className="clause-node-title">
        {data.title}
      </div>

      <div className="clause-node-text-preview" title={data.text}>
        {data.text}
      </div>

      {/* Source handle */}
      <Handle type="source" position={Position.Bottom} style={{ background: isActive ? '#10b981' : '#ef4444' }} />
    </div>
  );
};

export default ClauseNode;
