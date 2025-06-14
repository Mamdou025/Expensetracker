// src/hooks/useCategories.js
import { useState, useEffect } from 'react';
import { categoryService } from '../Services/categoryService';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading categories from API...');
      
      const data = await categoryService.getAll();
      
      // Extract just category names for your components
      const categoryNames = data.map(cat => cat.name);
      console.log('✅ Categories loaded:', categoryNames);
      setCategories(categoryNames);
    } catch (err) {
      console.error('❌ Error loading categories:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    categories,
    loading,
    error,
    refreshCategories: loadCategories
  };
};