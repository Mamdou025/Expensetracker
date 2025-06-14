// src/services/categoryService.js - Category API calls
import { apiClient } from './api';



export const categoryService = {
  // Get all categories with stats
  getAll: () => apiClient.get('/api/categories'),
  
  // Add new category
  create: async (name) => {
    console.log('🔄 Creating category:', name);
    try {
      const result = await apiClient.post('/api/categories', { name });
      console.log('✅ Category created successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to create category:', error);
      throw error;
    }
  },
  
  // Delete category
  delete: async (categoryName) => {
    console.log('🔄 Deleting category:', categoryName);
    try {
      const result = await apiClient.delete(`/api/categories/${categoryName}`);
      console.log('✅ Category deleted successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to delete category:', error);
      throw error;
    }
  }
};