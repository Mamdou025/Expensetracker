import { apiClient } from './api';

export const keywordMappingService = {
  applyCategory: async (keyword, category) => {
    return apiClient.post('/api/apply-keyword-category', { keyword, category });
  },
  applyTags: async (keyword, tags) => {
    return apiClient.post('/api/apply-keyword-tags', { keyword, tags });
  },
  getRules: async () => {
    return apiClient.get('/api/keyword-rules');
  },
  createRule: async (keyword, category = null, tags = []) => {
    return apiClient.post('/api/keyword-rules', { keyword, category, tags });
  },
  updateRule: async (keyword, category = null, tags = []) => {
    return apiClient.put(`/api/keyword-rules/${encodeURIComponent(keyword)}`, { category, tags });
  },
  deleteRule: async (keyword) => {
    return apiClient.delete(`/api/keyword-rules/${encodeURIComponent(keyword)}`);
  }
};
