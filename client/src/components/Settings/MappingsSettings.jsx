// src/components/settings/MappingsSettings.jsx
import React, { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { useTags } from '../../hooks/useTags';
import { keywordMappingService } from '../../Services/keywordMappingService';
import { useTranslation } from 'react-i18next';

const MappingsSettings = () => {
  const { categories } = useCategories();
  const { tags } = useTags();
  const { t } = useTranslation();

  const [keywordCat, setKeywordCat] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryResult, setCategoryResult] = useState(null);
  const [loadingCat, setLoadingCat] = useState(false);

  const [keywordTags, setKeywordTags] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagsResult, setTagsResult] = useState(null);
  const [loadingTags, setLoadingTags] = useState(false);

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!keywordCat || !selectedCategory) return;
    try {
      setLoadingCat(true);
      const res = await keywordMappingService.applyCategory(keywordCat, selectedCategory);
      setCategoryResult(res.updatedTransactions);
    } catch (err) {
      alert('Failed to apply category: ' + err.message);
    } finally {
      setLoadingCat(false);
    }
  };

  const handleTagSelect = (e) => {
    const options = Array.from(e.target.options);
    setSelectedTags(options.filter((o) => o.selected).map((o) => o.value));
  };

  const handleTagsSubmit = async (e) => {
    e.preventDefault();
    if (!keywordTags || selectedTags.length === 0) return;
    try {
      setLoadingTags(true);
      const res = await keywordMappingService.applyTags(keywordTags, selectedTags);
      setTagsResult(res.updatedTransactions);
    } catch (err) {
      alert('Failed to apply tags: ' + err.message);
    } finally {
      setLoadingTags(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold text-lg mb-4">{t('mappings.keywordCategory.title')}</h3>
        <p className="text-gray-600 mb-4">{t('mappings.keywordCategory.description')}</p>
        <form onSubmit={handleCategorySubmit} className="bg-gray-50 p-4 rounded-xl space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('mappings.keywordCategory.keyword')}</label>
            <input
              type="text"
              value={keywordCat}
              onChange={(e) => setKeywordCat(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('mappings.keywordCategory.category')}</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 bg-white"
            >
              <option value="">{t('mappings.keywordCategory.selectCategory')}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loadingCat}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            {t('mappings.keywordCategory.apply')}
          </button>
          {categoryResult !== null && (
            <p className="text-sm text-green-600">{t('mappings.keywordCategory.updated', { count: categoryResult })}</p>
          )}
        </form>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-4">{t('mappings.keywordTag.title')}</h3>
        <p className="text-gray-600 mb-4">{t('mappings.keywordTag.description')}</p>
        <form onSubmit={handleTagsSubmit} className="bg-gray-50 p-4 rounded-xl space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('mappings.keywordTag.keyword')}</label>
            <input
              type="text"
              value={keywordTags}
              onChange={(e) => setKeywordTags(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('mappings.keywordTag.tags')}</label>
            <select
              multiple
              value={selectedTags}
              onChange={handleTagSelect}
              className="w-full border rounded-lg px-3 py-2 bg-white h-32"
            >
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loadingTags}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            {t('mappings.keywordTag.apply')}
          </button>
          {tagsResult !== null && (
            <p className="text-sm text-green-600">{t('mappings.keywordTag.updated', { count: tagsResult })}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default MappingsSettings;
