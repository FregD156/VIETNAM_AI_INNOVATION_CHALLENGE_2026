import React from 'react';
import './VersionTimeline.css';

// Chuỗi phiên bản đã được sắp xếp trước theo năm (ngăn ngừa re-sort trong render)
const TIMELINE_DATA = {
  loan_limit: [
    {
      year: '2022',
      status: 'expired',
      version: 'v1.0',
      text: 'Đối với vay tiêu dùng tín chấp dành cho đối tác liên kết của SHB, hạn mức cho vay tối đa là 500.000.000 VNĐ. Thời hạn vay tối đa 60 tháng.'
    },
    {
      year: '2023',
      status: 'active',
      version: 'v2.0',
      text: 'Riêng đối với các khoản cho vay được duyệt online thông qua ứng dụng SHB Mobile, dư nợ cho vay tối đa đối với một khách hàng không vượt quá 100.000.000 VNĐ theo Thông tư 06/2023/TT-NHNN.'
    }
  ],
  ekyc: [
    {
      year: '2020',
      status: 'active',
      version: 'v1.0',
      text: 'Ngân hàng thương mại mở tài khoản thanh toán bằng eKYC phải áp dụng hạn mức tối đa 100 triệu đồng/tháng.'
    },
    {
      year: '2024',
      status: 'active',
      version: 'v1.1',
      text: 'Mở tài khoản eKYC phải thu thập CCCD gắn chip, thực hiện đối chiếu dữ liệu sinh trắc học với Cơ sở dữ liệu quốc gia về dân cư. Hạn mức giao dịch giữ nguyên 100 triệu đồng/tháng.'
    }
  ],
  deposit: [
    {
      year: '2016',
      status: 'expired',
      version: 'v1.0',
      text: 'Phương thức gia hạn nợ và lãi suất gia hạn do TCTD tự thỏa thuận. Nếu hết kỳ hạn khách hàng không đến rút, toàn bộ số dư được bảo lưu lãi suất không kỳ hạn.'
    },
    {
      year: '2025',
      status: 'active',
      version: 'v2.0',
      text: 'Tự động gia hạn cả gốc và lãi sang kỳ hạn mới tương đương kỳ hạn cũ. Lãi suất áp dụng là lãi suất công bố của SHB tại ngày tái tục.'
    }
  ]
};

export const VersionTimeline = ({ nodeId }) => {
  // Xác định dòng thời gian tương ứng với Node đang chọn
  let timelineKey = 'loan_limit';
  if (nodeId.includes('tt16') || nodeId.includes('qd104') || nodeId.includes('ekyc')) {
    timelineKey = 'ekyc';
  } else if (nodeId.includes('tt39') || nodeId.includes('tietkiem') || nodeId.includes('deposit')) {
    timelineKey = 'deposit';
  }

  const timelineItems = TIMELINE_DATA[timelineKey];

  return (
    <div className="version-timeline">
      {timelineItems.map((item, idx) => (
        <div key={idx} className="timeline-item">
          {/* Vòng tròn timeline với màu trạng thái */}
          <div className={`timeline-dot ${item.status}`} />
          
          <div className="timeline-header">
            <span className="timeline-year">Năm {item.year} ({item.version})</span>
            <span className={`timeline-status ${item.status}`}>
              {item.status === 'active' ? 'Có hiệu lực' : item.status === 'expired' ? 'Hết hạn' : 'Dự thảo'}
            </span>
          </div>

          <div className={`timeline-text ${item.status === 'active' ? 'highlight' : ''}`}>
            {item.text}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VersionTimeline;
