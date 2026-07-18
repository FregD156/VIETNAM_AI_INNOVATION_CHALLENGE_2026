import React, { useState, useEffect } from 'react';
import { LuCopy, LuCheck, LuRefreshCw, LuArrowRight } from 'react-icons/lu';
import { adminService } from '../../services/adminService';
import './ActionableDraft.css';

export const ActionableDraft = ({ draft }) => {
  const [draftText, setDraftText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | loading | success | error

  // Reset states khi draft nội dung thay đổi
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
    <div className="actionable-draft">
      <div className="draft-header">
        <span className="draft-title">
          {draft.type === 'email' ? '📧 Thư Điện Tử Nháp' : '📞 Kịch Bản Gọi Điện Nháp'}
        </span>
        <span className="draft-badge">Đề xuất bởi AI</span>
      </div>

      <textarea
        className="draft-editor"
        value={draftText}
        onChange={(e) => setDraftText(e.target.value)}
        placeholder="Nội dung bản nháp..."
      />

      <div className="draft-actions">
        {syncStatus === 'loading' && (
          <span className="sync-status loading">
            <LuRefreshCw className="animate-spin" /> Đang đồng bộ CRM...
          </span>
        )}
        {syncStatus === 'success' && (
          <span className="sync-status success">
            <LuCheck /> Đã đồng bộ CRM thành công!
          </span>
        )}

        <button className="btn-action btn-copy" onClick={handleCopy} title="Copy vào clipboard">
          {isCopied ? <LuCheck /> : <LuCopy />}
          <span>{isCopied ? 'Đã Copy' : 'Copy'}</span>
        </button>

        <button 
          className="btn-action btn-sync" 
          onClick={handleSyncCRM} 
          disabled={isSyncing || syncStatus === 'success'}
        >
          <LuArrowRight />
          <span>Đồng bộ CRM</span>
        </button>
      </div>
    </div>
  );
};

export default ActionableDraft;
