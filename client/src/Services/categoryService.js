// src/services/categoryService.js - Category API calls
import { apiClient } from './api';

export const categoryService = {
  // Get all categories with stats
  getAll: () => apiClient.get('/api/categories'),
};