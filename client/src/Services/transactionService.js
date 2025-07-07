// ===================================

// src/services/transactionService.js - Transaction API calls
import { apiClient } from './api';

export const transactionService = {
  // Get all transactions
  getAll: () => apiClient.get('/api/transactions'),

  // Get transactions by category
  getByCategory: (category) => apiClient.get(`/api/transactions/category/${category}`),

  // Get transactions by tag
  getByTag: (tag) => apiClient.get(`/api/transactions/tag/${tag}`),

  // Get tags for specific transaction
  getTransactionTags: (id) => apiClient.get(`/api/transactions/${id}/tags`),

  // Add tag to transaction
  addTag: (transactionId, tag) => 
    apiClient.post(`/api/transactions/${transactionId}/tags`, { tag }),

  // Remove tag from transaction
  removeTag: (transactionId, tag) =>
    apiClient.delete(`/api/transactions/${transactionId}/tags`, { tag }),

  // Delete a transaction
  delete: async (id) => {
    console.log('🔄 Deleting transaction:', id);
    try {
      const result = await apiClient.delete(`/api/transactions/${id}`);
      console.log('✅ Transaction deleted successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to delete transaction:', error);
      throw error;
    }
  },

  // Update transaction category
  updateCategory: (id, category) => 
    apiClient.put(`/api/transactions/${id}/category`, { category }),

  // Get dashboard stats
  getDashboardStats: () => apiClient.get('/api/dashboard/stats'),

  // Get monthly spending data
  getMonthlySpending: () => apiClient.get('/api/dashboard/monthly-spending'),




// Add these methods to your existing transactionService object in src/Services/transactionService.js

// Update transaction amount
updateAmount: async (id, amount) => {
  console.log('🔄 Updating transaction amount:', id, amount);
  try {
    const result = await apiClient.put(`/api/transactions/${id}/amount`, { amount });
    console.log('✅ Amount updated successfully');
    return result;
  } catch (error) {
    console.error('❌ Failed to update amount:', error);
    throw error;
  }
},

// Update transaction description
updateDescription: async (id, description) => {
  console.log('🔄 Updating transaction description:', id, description);
  try {
    const result = await apiClient.put(`/api/transactions/${id}/description`, { description });
    console.log('✅ Description updated successfully');
    return result;
  } catch (error) {
    console.error('❌ Failed to update description:', error);
    throw error;
  }
},





  // Get category breakdown
  getCategoryBreakdown: (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiClient.get(`/api/analytics/category-breakdown?${params}`);
  }
};
