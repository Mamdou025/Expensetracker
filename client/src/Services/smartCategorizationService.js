// Smart Categorization Service for frontend
import { apiClient } from './api';

export const smartCategorizationService = {
  // Run smart categorization on uncategorized transactions
  runSmartCategorization: () => 
    apiClient.post('/api/smart-categorization/run'),
  
  // Get categorization statistics
  getStats: () => 
    apiClient.get('/api/smart-categorization/stats'),
  
  // Get keyword mapping rules
  getKeywordRules: () => 
    apiClient.get('/api/keyword-rules'),
  
  // Add new keyword rule
  addKeywordRule: (rule) => 
    apiClient.post('/api/keyword-rules', rule),
  
  // Delete keyword rule
  deleteKeywordRule: (keyword) => 
    apiClient.delete(`/api/keyword-rules/${keyword}`),
  
  // Get keyword suggestions from uncategorized transactions
  getKeywordSuggestions: () => 
    apiClient.get('/api/keyword-rules/suggestions'),
  
  // Train ML model
  trainMLModel: () => 
    apiClient.post('/api/ml-categorization/train'),
  
  // Get ML model performance
  getMLModelStats: () => 
    apiClient.get('/api/ml-categorization/stats'),
  
  // Run ML predictions
  runMLPredictions: (confidenceThreshold = 0.6) => 
    apiClient.post('/api/ml-categorization/predict', { confidenceThreshold }),
  
  // Get categorization preview (what would be changed)
  previewCategorization: (method = 'smart') => 
    apiClient.get(`/api/smart-categorization/preview?method=${method}`)
};