import { api } from './api';
import mockGraphData from '../mocks/mockGraphData.json';

export const graphService = {
  /**
   * Lấy cấu trúc Đồ thị tri thức dạng {rawNodes, rawRelationships}
   * // TODO: xác nhận lại schema với backend
   */
  getGraphData: async () => {
    try {
      return await api.get('/graph');
    } catch (error) {
      console.warn('Backend API not available, falling back to mock graph data.', error);
      return mockGraphData;
    }
  }
};
