import React, { useState } from 'react';
import { LuTriangleAlert, LuArrowRightLeft, LuChevronDown, LuChevronUp } from 'react-icons/lu';
import './WarningCard.css';

export const WarningCard = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`warning-card ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div 
        className="warning-card-header" 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
        title={isExpanded ? "Click để thu gọn cảnh báo" : "Click để mở rộng xem chi tiết mâu thuẫn"}
      >
        <div className="warning-header-left">
          <div className="warning-icon-wrapper warning-icon">
            <LuTriangleAlert />
          </div>
          <span className="warning-card-title">Phát hiện mâu thuẫn pháp quy chéo</span>
        </div>
        <div className="warning-toggle-icon">
          {isExpanded ? <LuChevronUp /> : <LuChevronDown />}
        </div>
      </div>
      
      {isExpanded && (
        <>
          {/* 2-Column Comparative Layout for High-end visual comparison */}
          <div className="warning-comparison-container animate-slide-down">
            <div className="comparison-column internal-rule">
              <span className="column-label">Quy chế nội bộ SHB</span>
              <div className="column-content-box">
                <span className="rule-code monospace">QĐ 214/2022/QĐ-SHB</span>
                <p className="rule-summary-text">Cho phép hạn mức cho vay tiêu dùng tín chấp trực tuyến tối đa <strong>500 triệu VNĐ</strong>.</p>
              </div>
            </div>

            <div className="comparison-connector">
              <LuArrowRightLeft className="connector-icon" />
            </div>

            <div className="comparison-column central-bank-law">
              <span className="column-label">Thông tư Ngân hàng Nhà nước</span>
              <div className="column-content-box">
                <span className="rule-code compliance monospace">TT 06/2023/TT-NHNN</span>
                <p className="rule-summary-text">Giới hạn hạn mức cho vay tiêu dùng duyệt online tối đa không quá <strong>100 triệu VNĐ</strong>.</p>
              </div>
            </div>
          </div>

          <div className="warning-footer-resolution animate-slide-down">
            <span className="resolution-prefix">Khuyến nghị tuân thủ:</span>
            <span className="resolution-text">
              Áp dụng hạn mức tối đa <strong>100 triệu VNĐ</strong> khi thực hiện thiết lập hồ sơ và phê duyệt cho vay trực tuyến để đảm bảo tính tuân thủ pháp luật tối cao.
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default WarningCard;
