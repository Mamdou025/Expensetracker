// src/hooks/useTags.js
import { useState, useEffect } from 'react';
import { tagService } from '../Services/tagService';

export const useTags = ({ enabled = true } = {}) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    loadTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

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