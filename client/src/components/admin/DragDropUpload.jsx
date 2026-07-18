import React, { useState, useRef } from 'react';
import { LuUpload, LuFile, LuTrash2, LuCircleCheck } from 'react-icons/lu';
import { useFileUpload } from '../../hooks/useFileUpload';
import './DragDropUpload.css';

export const DragDropUpload = () => {
  const { uploadQueue, uploadFile, removeFromQueue } = useFileUpload();
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      files.forEach(file => {
        // Chỉ nhận file PDF
        if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
          uploadFile(file);
        }
      });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        uploadFile(file);
      });
    }
  };

  const onButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="upload-container">
      {/* Input ẩn để trigger click */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Vùng kéo thả kéo thả file */}
      <div 
        className={`dropzone ${isDragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <LuUpload className="upload-icon" />
        <span className="upload-text">Kéo thả tài liệu PDF hoặc Click để chọn</span>
        <span className="upload-subtext">Hỗ trợ các thông tư, quy chế nội bộ định dạng PDF (Max 20MB)</span>
      </div>

      {/* Danh sách file đang nạp lên RAG */}
      {uploadQueue.length > 0 && (
        <div className="upload-queue-list">
          {uploadQueue.map(item => (
            <div key={item.id} className="queue-item">
              <div className="queue-item-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <LuFile style={{ color: 'var(--color-accent-gold)', flexShrink: 0 }} />
                  <div className="file-info">
                    <span className="file-name">{item.fileName}</span>
                    <span className="file-size">{item.fileSize}</span>
                  </div>
                </div>
                
                <div className="queue-actions">
                  {item.status === 'success' ? (
                    <LuCircleCheck style={{ color: 'var(--color-success)', fontSize: '16px' }} />
                  ) : (
                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      {item.progress}%
                    </span>
                  )}
                  <button 
                    className="btn-remove-queue" 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromQueue(item.id);
                    }}
                  >
                    <LuTrash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Thanh tiến trình */}
              {item.status !== 'success' && (
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DragDropUpload;
