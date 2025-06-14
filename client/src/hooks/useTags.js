// src/hooks/useTags.js
import { useState, useEffect } from 'react';
import { tagService } from '../Services/tagservice';

export const useTags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading tags from API...');
      
      const data = await tagService.getAllWithStats();
      
      // Extract just tag names for your components
      const tagNames = data.map(tag => tag.name);
      console.log('✅ Tags loaded:', tagNames);
      setTags(tagNames);
    } catch (err) {
      console.error('❌ Error loading tags:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    tags,
    loading,
    error,
    refreshTags: loadTags
  };
};