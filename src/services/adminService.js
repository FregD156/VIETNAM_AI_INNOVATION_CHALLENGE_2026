import { api } from './api';
import mockDiffData from '../mocks/mockDiffData.json';

export const adminService = {
  /**
   * Tải tài liệu lên để hệ thống parse và vector hóa
   */
  uploadDocument: async (file, onProgress) => {
    try {
      return await api.upload('/admin/upload', file, onProgress);
    } catch (error) {
      console.warn('Backend API not available, simulating document upload.', error);
      
      // Giả lập phản hồi thành công sau khi upload xong ở client
      return new Promise((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          if (onProgress) onProgress(progress);
          
          if (progress >= 100) {
            clearInterval(interval);
            resolve({
              success: true,
              message: `Đã upload và phân tách thành công file ${file.name}`,
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
