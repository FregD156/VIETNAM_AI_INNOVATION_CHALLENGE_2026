import React from 'react';
import { LuSlidersHorizontal } from 'react-icons/lu';
import DragDropUpload from './DragDropUpload';
import GraphChangePreview from './GraphChangePreview';
import './AdminWorkspace.css';

export const AdminWorkspace = () => {
  // Nhật ký hoạt động kiểm toán hệ thống (Audit Logs) đáp ứng an ninh dữ liệu
  const mockAuditLogs = [
    { time: '14:22', action: 'Nạp tài liệu: QĐ 104/2024/SHB (eKYC)', status: 'Thành công' },
    { time: '13:05', action: 'Quét an ninh PII (Decree 13/2023)', status: 'An toàn' },
    { time: '11:15', action: 'Đồng bộ CRM Sandbox: Kịch bản vay tín chấp', status: 'Thành công' },
    { time: '09:40', action: 'Cập nhật đồ thị: Thông tư 06/2023/TT-NHNN', status: 'Thành công' }
  ];

  return (
    <div className="admin-workspace">
      {/* Header */}
      <header className="workspace-header">
        <div className="workspace-title">
          <LuSlidersHorizontal />
          <span>Hệ thống Quản trị & Nạp văn bản CSDL</span>
        </div>
        <div className="workspace-badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          Admin Mode
        </div>
      </header>

      {/* Grid Layout split 2 panels */}
      <div className="admin-grid">
        {/* Cột trái: Drag & Drop và Nhật ký hoạt động */}
        <div className="admin-panel">
          <div className="admin-card">
            <span className="admin-card-title">Cập nhật tài liệu mới</span>
            <DragDropUpload />
          </div>

          <div className="admin-card">
            <span className="admin-card-title">Nhật ký kiểm toán an ninh (Audit Logs)</span>
            <div className="audit-log-list">
              {mockAuditLogs.map((log, idx) => (
                <div key={idx} className="audit-log-item">
                  <span className="log-time">{log.time}</span>
                  <span className="log-action">{log.action}</span>
                  <span className="log-status success">{log.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cột phải: Bản xem trước so sánh thay đổi đồ thị */}
        <div className="admin-panel">
          <GraphChangePreview />
        </div>
      </div>
    </div>
  );
};

export default AdminWorkspace;
