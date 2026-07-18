import React, { useState, useEffect } from 'react';
import { LuCopy, LuCheck, LuRefreshCw, LuCloudUpload } from 'react-icons/lu';
import { adminService } from '../../services/adminService';
import './ActionableDraft.css';

export const ActionableDraft = ({ draft }) => {
  const [draftText, setDraftText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | loading | success | error

  // Reset states khi nội dung draft thay đổi
  useEffect(() => {
    if (draft) {
      setDraftText(draft.content);
      setIsCopied(false);
      setSyncStatus('idle');
    }
  }, [draft]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draftText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Không thể copy bản nháp:', err);
    }
  };

  const handleSyncCRM = async () => {
    setIsSyncing(true);
    setSyncStatus('loading');
    
    try {
      const res = await adminService.syncCrm(draft.type, draftText);
      if (res && res.success) {
        setSyncStatus('success');
      } else {
        setSyncStatus('error');
      }
    } catch (e) {
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      // Reset trạng thái sau 3 giây để nút bấm khôi phục
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  if (!draft) return null;

  return (
    <div className="actionable-draft-container">
      {/* Draft Header Toolbar */}
      <div className="draft-toolbar-header">
        <div className="draft-type-tag">
          <span className="draft-bullet-dot"></span>
          <span className="draft-type-name">
            {draft.type === 'email' ? '📧 Bản nháp Email Khách hàng' : '📞 Kịch bản Thoại RM'}
          </span>
        </div>
        
        <div className="draft-toolbar-right-actions">
          {/* Status Labels */}
          {syncStatus === 'loading' && (
            <span className="sync-badge loading">
              <LuRefreshCw className="icon-spin-animation" />
              <span>Đang đồng bộ CRM...</span>
            </span>
          )}
          {syncStatus === 'success' && (
            <span className="sync-badge success">
              <LuCheck />
              <span>CRM Synced</span>
            </span>
          )}

          <button 
            className={`btn-toolbar-tool btn-copy ${isCopied ? 'copied' : ''}`} 
            onClick={handleCopy} 
            title="Sao chép văn bản"
          >
            {isCopied ? <LuCheck /> : <LuCopy />}
            <span>{isCopied ? 'Đã sao chép' : 'Sao chép'}</span>
          </button>

          <button 
            className="btn-toolbar-tool btn-crm-sync" 
            onClick={handleSyncCRM} 
            disabled={isSyncing || syncStatus === 'success'}
            title="Đồng bộ bản nháp này sang CRM nội bộ SHB"
          >
            <LuCloudUpload />
            <span>Đồng bộ CRM</span>
          </button>
        </div>
      </div>

      {/* Editor Box styled as paper sheet for high-end feel */}
      <div className="draft-paper-editor-wrapper">
        <textarea
          className="draft-editor-textarea paper-surface"
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          placeholder="Nội dung bản nháp pháp lý..."
        />
        <div className="paper-watermark">SHB COMPLIANCE DRAFT</div>
      </div>
    </div>
  );
};

export default ActionableDraft;
