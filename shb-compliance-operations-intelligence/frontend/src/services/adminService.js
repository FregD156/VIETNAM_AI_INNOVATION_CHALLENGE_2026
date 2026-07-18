import { api } from './api';
import mockDiffData from '../mocks/mockDiffData.json';

export const adminService = {
  /**
   * Tải tài liệu lên để hệ thống parse và vector hóa
   */
  uploadDocument: async (file, onProgress) => {
    try {
      if (onProgress) onProgress(20); // Tiến trình giả lập: đang đọc file

      // 1. Sử dụng FileReader để đọc nội dung file dạng text ở Client
      const readTextFile = (fileToRead) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsText(fileToRead);
        });
      };

      const fileContent = await readTextFile(file);
      if (onProgress) onProgress(50); // Tiến trình giả lập: đang tải lên

      // 2. Gửi request POST JSON đúng định dạng AdminUploadRequest lên /admin/documents
      const result = await api.post('/admin/documents', {
        filename: file.name,
        content: fileContent
      });

      if (onProgress) onProgress(100); // Hoàn thành

      return {
        success: true,
        message: result.message || `Đã upload và phân tách thành công file ${file.name}`,
        proposedDiff: result.proposedDiff || mockDiffData.amendment_loan_policy // Fallback diff preview
      };
    } catch (error) {
      console.warn('Backend API not available or upload failed, simulating document upload.', error);
      
      // Giả lập phản hồi thành công sau khi upload xong ở client (Fallback)
      return new Promise((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          if (onProgress) onProgress(progress);
          
          if (progress >= 100) {
            clearInterval(interval);
            resolve({
              success: true,
              message: `Đã upload và phân tách thành công file ${file.name} (Giả lập)`,
              proposedDiff: mockDiffData.amendment_loan_policy
            });
          }
        }, 400);
      });
    }
  },

  /**
   * Đồng bộ kịch bản/email nháp của RM vào hệ thống CRM của Bank A
   */
  syncCrm: async (draftType, draftContent) => {
    try {
      return await api.post('/admin/crm-sync', { type: draftType, content: draftContent });
    } catch (error) {
      console.warn('Backend API not available, simulating CRM sync.', error);
      
      // Giả lập thời gian đồng bộ
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `Đồng bộ thành công bản nháp ${draftType} vào CRM Sandbox!`
          });
        }, 1200);
      });
    }
  }
};
