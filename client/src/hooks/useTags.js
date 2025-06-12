
// src/hooks/useTags.js - Custom hook for tags
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
      const data = await tagService.getWithStats();
      
      // Extract just the tag names for your existing components
      const tagNames = data.map(tag => tag.name);
      setTags(tagNames);
    } catch (err) {
      console.error('Error loading tags:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTag = async (tagName) => {
    try {
      await tagService.delete(tagName);
      await loadTags(); // Reload to get updated data
    } catch (err) {
      console.error('Error deleting tag:', err);
      setError(err.message);
      throw err;
    }
  };

  return {
    tags,
    loading,
    error,
    refreshTags: loadTags,
    deleteTag
  };
};