import React from 'react';
import { Handle, Position } from 'reactflow';
import './ClauseNode.css';

export const ClauseNode = ({ data }) => {
  const isActive = data.status === 'active';
  // Đổ màu handle theo tình trạng hiệu lực: Active = Green, Expired = Brick Red
  const handleColor = isActive ? 'var(--emerald-active)' : 'var(--brick-expired)';
  
  return (
    <div className={`clause-node ${isActive ? 'active' : 'expired'}`}>
      {/* Target handle */}
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ background: handleColor, width: 8, height: 8 }} 
      />
      
      <div className="clause-node-header">
        <span className="clause-status-tag">
          {isActive ? 'Active Clause' : 'Expired Clause'}
        </span>
      </div>
      
      <div className="clause-node-title">
        {data.title}
      </div>

      <div className="clause-node-text-preview" title={data.content || data.text || ''}>
        {data.content || data.text || ''}
      </div>

      {/* Source handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ background: handleColor, width: 8, height: 8 }} 
      />
    </div>
  );
};

export default ClauseNode;
