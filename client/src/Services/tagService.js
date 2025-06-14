// src/Services/tagservice.js - Complete file with all methods
import { apiClient } from './api';

export const tagService = {
  // Get all tags with stats - THIS WAS MISSING
  getAllWithStats: async () => {
    console.log('🔄 Fetching all tags with stats...');
    try {
      const data = await apiClient.get('/api/tags/stats');
      console.log('✅ Tags loaded:', data.length, 'tags');
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch tags:', error);
      throw error;
    }
  },

  // Get just tag names (simplified)
  getAllNames: async () => {
    try {
      const data = await tagService.getAllWithStats();
      return data.map(tag => tag.name);
    } catch (error) {
      console.error('❌ Failed to fetch tag names:', error);
      throw error;
    }
  },

  // Add new tag
  create: async (name) => {
    console.log('🔄 Creating tag:', name);
    try {
      const result = await apiClient.post('/api/tags', { name });
      console.log('✅ Tag created successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to create tag:', error);
      throw error;
    }
  },

  // Delete a tag
  delete: async (tagName) => {
    console.log('🔄 Deleting tag:', tagName);
    try {
      const result = await apiClient.delete(`/api/tags/${tagName}`);
      console.log('✅ Tag deleted successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to delete tag:', error);
      throw error;
    }
  }
};



