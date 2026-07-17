import React, { useState, useEffect } from 'react';
import { LuBookOpen, LuX } from 'react-icons/lu';
import { chatService } from '../../services/chatService';
import './CitationModal.css';

export const CitationModal = ({ citationId, onClose }) => {
  const [citationData, setCitationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Lazy loading nội dung trích dẫn chi tiết khi Modal được mở
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchDetail = async () => {
      try {
        const data = await chatService.getCitationDetail(citationId);
        if (isMounted) {
          setCitationData(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Lỗi khi tải chi tiết trích dẫn:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [citationId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <LuBookOpen />
            <span>{isLoading ? 'Đang tải nguồn luật...' : citationData?.label}</span>
          </div>
          <button className="btn-close" onClick={onClose}>
            <LuX />
          </button>
        </div>

        <div className="modal-body">
          {isLoading ? (
            // Skeleton Loader khi đang fetch dữ liệu
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="skeleton" style={{ height: '18px', width: '40%' }} />
              <div className="skeleton" style={{ height: '14px', width: '90%' }} />
              <div className="skeleton" style={{ height: '14px', width: '95%' }} />
              <div className="skeleton" style={{ height: '14px', width: '80%' }} />
              <div className="skeleton" style={{ height: '14px', width: '85%' }} />
            </div>
          ) : (
            <div className="paper-surface citation-paper-content">
              <p>{citationData?.sourceText}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-dismiss" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default CitationModal;
