import React from 'react';
import { Handle, Position } from 'reactflow';
import './ClauseNode.css';

export const ClauseNode = ({ data }) => {
  const isActive = data.status === 'active' || data.status === 'Còn hiệu lực' || data.status === 'Còn hiệu lực một phần';
  
  // Đổ màu dot theo tình trạng hiệu lực: Active = Green, Expired = Brick Red
  const handleColor = isActive ? 'var(--emerald-active)' : 'var(--brick-expired)';
  
  return (
    <div className={`clause-node-dot ${isActive ? 'active' : 'expired'}`}>
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
      
      <div className="clause-dot-circle" style={{ backgroundColor: handleColor }} />
      
      <div className="clause-dot-label">
        {data.title || data.id}
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

export default ClauseNode;
