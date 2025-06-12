
// src/hooks/useCategories.js - Custom hook for categories
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
      const data = await categoryService.getAll();
      
      // Extract just the category names for your existing components
      const categoryNames = data.map(cat => cat.name);
      setCategories(categoryNames);
    } catch (err) {
      console.error('Error loading categories:', err);
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
