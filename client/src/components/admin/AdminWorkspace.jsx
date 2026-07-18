import React from 'react';
import { LuSlidersHorizontal, LuActivity, LuShieldCheck } from 'react-icons/lu';
import DragDropUpload from './DragDropUpload';
import GraphChangePreview from './GraphChangePreview';
import './AdminWorkspace.css';

export const AdminWorkspace = () => {
  // Nhật ký hoạt động kiểm toán hệ thống (Audit Logs) đáp ứng an toàn bảo mật
  const mockAuditLogs = [
    { time: '14:22:10', type: 'UPLOAD', action: 'Nạp tài liệu: QĐ 104/2024/SHB (eKYC)', status: 'Success' },
    { time: '13:05:45', type: 'SECURITY', action: 'Quét an ninh PII (Decree 13/2023) - Không phát hiện rò rỉ dữ liệu', status: 'Secure' },
    { time: '11:15:30', type: 'SYNC', action: 'Đồng bộ CRM Sandbox: Quy trình cho vay tiêu dùng', status: 'Success' },
    { time: '09:40:12', type: 'GRAPH', action: 'Cập nhật GraphDB: Thông tư 06/2023/TT-NHNN', status: 'Success' }
  ];

  return (
    <div className="admin-workspace-container">
      {/* Workspace Top Header */}
      <header className="admin-workspace-header">
        <div className="admin-header-left">
          <div className="admin-header-icon-box">
            <LuSlidersHorizontal />
          </div>
          <div className="admin-header-text">
            <h1 className="admin-main-title">Hệ thống Quản trị & Nạp văn bản CSDL</h1>
            <p className="admin-sub-title">Cập nhật văn bản pháp quy chéo, phân tách thực thể & kiểm toán hệ thống RAG</p>
          </div>
        </div>
        <div className="admin-header-badge">
          <LuShieldCheck className="badge-icon" />
          <span>SHB SECURE ADMIN</span>
        </div>
      </header>

      {/* Grid Layout split 2 main panels */}
      <div className="admin-workspace-grid-layout">
        {/* Left Side: Document ingestion and Security Audit Logs */}
        <div className="admin-grid-column left-side">
          <section className="admin-card-section">
            <div className="admin-card-header-row">
              <span className="admin-card-title-text">Nạp tài liệu văn bản mới (PDF)</span>
              <span className="admin-card-header-badge">RAG Parser v2</span>
            </div>
            <div className="admin-card-content">
              <DragDropUpload />
            </div>
          </section>

          <section className="admin-card-section">
            <div className="admin-card-header-row">
              <span className="admin-card-title-text">Nhật ký kiểm toán an ninh (Security Audit Logs)</span>
              <div className="status-indicator">
                <LuActivity className="status-pulse-icon" />
                <span>Realtime</span>
              </div>
            </div>
            
            <div className="admin-card-content">
              <div className="audit-logs-table-list">
                {mockAuditLogs.map((log, idx) => (
                  <div key={idx} className="audit-log-row-item">
                    <span className="log-row-time monospace">{log.time}</span>
                    <span className="log-row-badge-type monospace">{log.type}</span>
                    <span className="log-row-desc-text">{log.action}</span>
                    <div className="log-row-status-wrapper">
                      <span className="log-row-status-dot"></span>
                      <span className="log-row-status-text monospace">{log.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right Side: Visual Graph diff comparison and Neo4j sync */}
        <div className="admin-grid-column right-side">
          <GraphChangePreview />
        </div>
      </div>
    </div>
  );
};

export default AdminWorkspace;
