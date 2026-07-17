import { api } from './api';
import mockChatResponse from '../mocks/mockChatResponse.json';

export const chatService = {
  /**
   * Gửi câu hỏi lên hệ thống Advanced RAG
   * // TODO: xác nhận lại schema với backend
   */
  askQuestion: async (queryText) => {
    try {
      // Gọi API thật nếu có backend
      return await api.post('/chat', { query: queryText });
    } catch (error) {
      console.warn('Backend API not available, falling back to mock data.', error);
      
      // Khớp từ khóa thô trên client để lấy mock data
      const normalizedQuery = queryText
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

      let key = 'kyc_docs';
      if (normalizedQuery.includes('vay') || normalizedQuery.includes('tin chap') || normalizedQuery.includes('han muc') || normalizedQuery.includes('loan')) {
        key = 'loan_limit';
      } else if (normalizedQuery.includes('tiet kiem') || normalizedQuery.includes('dao han') || normalizedQuery.includes('gia han') || normalizedQuery.includes('deposit')) {
        key = 'deposit_renewal';
      }

      return mockChatResponse[key];
    }
  },

  /**
   * Lấy chi tiết nội dung của một Điều khoản trích dẫn (Lazy loading)
   */
  getCitationDetail: async (citationId) => {
    try {
      return await api.get(`/citation/${citationId}`);
    } catch (error) {
      console.warn(`Failed to fetch citation ${citationId} from server, fallback to mock search.`);
      
      // Duyệt qua tất cả mock responses để tìm citation khớp
      for (const response of Object.values(mockChatResponse)) {
        if (response.citations) {
          const found = response.citations.find(c => c.id === citationId);
          if (found) return found;
        }
      }
      return { id: citationId, label: citationId, sourceText: 'Không tìm thấy nội dung trích dẫn chi tiết.' };
    }
  }
};
