import React from 'react';
import { LuTriangleAlert } from 'react-icons/lu';
import './WarningCard.css';

export const WarningCard = () => {
  return (
    <div className="warning-card animate-wiggle">
      <div className="warning-icon">
        <LuTriangleAlert />
      </div>
      <div className="warning-content">
        <span className="warning-title">Cảnh báo xung đột pháp quy</span>
        <p className="warning-text">
          Hệ thống phát hiện mâu thuẫn về hạn mức vay tiêu dùng tín chấp trực tuyến giữa 
          <strong> Quy chế SHB (QĐ 214/2022)</strong> (tối đa 500 triệu) và 
          <strong> Thông tư 06/2023/TT-NHNN</strong> (tối đa 100 triệu đối với khoản vay duyệt online).
        </p>
        <span className="warning-action">
          * Khuyến nghị: Áp dụng hạn mức tối đa 100 triệu VNĐ khi thực hiện tư vấn cho vay trực tuyến.
        </span>
      </div>
    </div>
  );
};

export default WarningCard;
