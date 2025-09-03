import { apiClient } from './api';

export const keywordMappingService = {
  applyCategory: async (keyword, category) => {
    return apiClient.post('/api/apply-keyword-category', { keyword, category });
  },
  applyTags: async (keyword, tags) => {
    return apiClient.post('/api/apply-keyword-tags', { keyword, tags });
  },
  createRule: async (keyword, mapping) => {
    return apiClient.post('/api/rules', { keyword, ...mapping });
  }
};
