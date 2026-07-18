import { useAdminContext } from '../context/AdminContext';
import { adminService } from '../services/adminService';

export const useFileUpload = () => {
  const {
    uploadQueue,
    diffPreviewData,
    setDiffPreviewData,
    addToQueue,
    removeFromQueue,
    clearQueue
  } = useAdminContext();

  const uploadFile = async (file) => {
    // 1. Thêm vào hàng đợi upload hiển thị UI
    addToQueue(file);

    try {
      // 2. Gọi service upload thật/mock
      const response = await adminService.uploadDocument(file);
      if (response && response.proposedDiff) {
        setDiffPreviewData(response.proposedDiff);
      }
      return response;
    } catch (error) {
      console.error('File upload hook failed:', error);
      throw error;
    }
  };

  return {
    uploadQueue,
    diffPreviewData,
    uploadFile,
    removeFromQueue,
    clearQueue
  };
};
export default useFileUpload;
