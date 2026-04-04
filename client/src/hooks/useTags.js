// src/hooks/useTags.js
import { useState, useEffect } from 'react';
import { tagService } from '../Services/tagService';

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
      const data = await tagService.getAllWithStats();
      const tagNames = data.map(tag => tag.name);
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