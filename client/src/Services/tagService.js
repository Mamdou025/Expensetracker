import { apiClient } from './api';

export const tagService = {
  getAllWithStats: async () => {
    try {
      const data = await apiClient.get('/api/tags/stats');
      return data;
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      throw error;
    }
  },

  getAllNames: async () => {
    try {
      const data = await tagService.getAllWithStats();
      return data.map(tag => tag.name);
    } catch (error) {
      console.error('Failed to fetch tag names:', error);
      throw error;
    }
  },

  create: async (name) => {
    try {
      const result = await apiClient.post('/api/tags', { name });
      return result;
    } catch (error) {
      console.error('Failed to create tag:', error);
      throw error;
    }
  },

  delete: async (tagName) => {
    try {
      const result = await apiClient.delete(`/api/tags/${tagName}`);
      return result;
    } catch (error) {
      console.error('Failed to delete tag:', error);
      throw error;
    }
  }
};
