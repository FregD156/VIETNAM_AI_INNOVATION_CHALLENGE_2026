import React, { createContext, useContext, useState, useCallback } from 'react';
import mockDiffData from '../mocks/mockDiffData.json';

const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
  const [uploadQueue, setUploadQueue] = useState([]);
  const [diffPreviewData, setDiffPreviewData] = useState(mockDiffData.amendment_loan_policy);

  const addToQueue = useCallback((file) => {
    const queueId = 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newFileEntry = {
      id: queueId,
      fileName: file.name,
      fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      progress: 0,
      status: 'pending' // pending | uploading | success | error
    };

    setUploadQueue(prev => [...prev, newFileEntry]);

    // Giả lập tiến trình upload tài liệu RAG
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setUploadQueue(prev => 
        prev.map(item => 
          item.id === queueId 
            ? { 
                ...item, 
                progress: currentProgress,
                status: currentProgress === 100 ? 'success' : 'uploading'
              } 
            : item
        )
      );

      if (currentProgress >= 100) {
        clearInterval(interval);
      }
    }, 300);
  }, []);

  const removeFromQueue = useCallback((id) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearQueue = useCallback(() => {
    setUploadQueue([]);
  }, []);

  return (
    <AdminContext.Provider value={{
      uploadQueue,
      diffPreviewData,
      setDiffPreviewData,
      addToQueue,
      removeFromQueue,
      clearQueue
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
};
