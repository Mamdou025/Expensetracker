// src/services/tagService.js - Tag API calls
import { apiClient } from './api';

export const tagService = {
  // Get all tags
  getAll: () => apiClient.get('/api/tags'),

  // Get tags with stats
  getWithStats: () => apiClient.get('/api/tags/stats'),

  // Delete a tag
  delete: (tagName) => apiClient.delete(`/api/tags/${tagName}`),
};