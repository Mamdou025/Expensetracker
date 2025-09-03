// src/components/settings/MappingsSettings.jsx
import React, { useState, useEffect } from 'react';
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

  const [rules, setRules] = useState([]);
  const [editingKeyword, setEditingKeyword] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState([]);

  const loadRules = async () => {
    try {
      const data = await keywordMappingService.getRules();
      const normalized = data.map((r) => ({
        ...r,
        tags: Array.isArray(r.tags)
          ? r.tags
          : r.tags
          ? r.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : []
      }));
      setRules(normalized);
    } catch (err) {
      console.error('Failed to load rules:', err);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!keywordCat || !selectedCategory) return;
    try {
      setLoadingCat(true);
      const res = await keywordMappingService.applyCategory(keywordCat, selectedCategory);
      setCategoryResult(res.updatedTransactions);
      await keywordMappingService.createRule(keywordCat, selectedCategory, []);
      await loadRules();
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
      await keywordMappingService.createRule(keywordTags, null, selectedTags);
      await loadRules();
    } catch (err) {
      alert('Failed to apply tags: ' + err.message);
    } finally {
      setLoadingTags(false);
    }
  };

  const startEditRule = (rule) => {
    setEditingKeyword(rule.keyword);
    setEditCategory(rule.category || '');
    setEditTags(rule.tags || []);
  };

  const handleEditTagSelect = (e) => {
    const options = Array.from(e.target.options);
    setEditTags(options.filter((o) => o.selected).map((o) => o.value));
  };

  const cancelEdit = () => {
    setEditingKeyword(null);
    setEditCategory('');
    setEditTags([]);
  };

  const saveEdit = async () => {
    try {
      await keywordMappingService.updateRule(editingKeyword, editCategory, editTags);
      cancelEdit();
      await loadRules();
    } catch (err) {
      alert('Failed to update rule: ' + err.message);
    }
  };

  const handleDeleteRule = async (keyword) => {
    if (!window.confirm('Delete this rule?')) return;
    try {
      await keywordMappingService.deleteRule(keyword);
      await loadRules();
    } catch (err) {
      alert('Failed to delete rule: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold text-lg mb-4">{t('mappings.rules.title')}</h3>
        <table className="min-w-full text-sm mb-8">
          <thead>
            <tr>
              <th className="text-left p-2">{t('mappings.rules.keyword')}</th>
              <th className="text-left p-2">{t('mappings.rules.category')}</th>
              <th className="text-left p-2">{t('mappings.rules.tags')}</th>
              <th className="text-left p-2">{t('mappings.rules.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 && (
              <tr>
                <td colSpan="4" className="p-2">
                  {t('mappings.rules.noRules')}
                </td>
              </tr>
            )}
            {rules.map((rule) => (
              editingKeyword === rule.keyword ? (
                <tr key={rule.keyword}>
                  <td className="p-2">{rule.keyword}</td>
                  <td className="p-2">
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full border rounded-lg px-2 py-1 bg-white"
                    >
                      <option value="">{t('mappings.keywordCategory.selectCategory')}</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      multiple
                      value={editTags}
                      onChange={handleEditTagSelect}
                      className="w-full border rounded-lg px-2 py-1 bg-white h-20"
                    >
                      {tags.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 space-x-2">
                    <button
                      onClick={saveEdit}
                      className="px-2 py-1 bg-green-500 text-white rounded"
                    >
                      {t('mappings.rules.save')}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-2 py-1 bg-gray-300 rounded"
                    >
                      {t('mappings.rules.cancel')}
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={rule.keyword}>
                  <td className="p-2">{rule.keyword}</td>
                  <td className="p-2">{rule.category || '-'}</td>
                  <td className="p-2">{rule.tags && rule.tags.length > 0 ? rule.tags.join(', ') : '-'}</td>
                  <td className="p-2 space-x-2">
                    <button
                      onClick={() => startEditRule(rule)}
                      className="px-2 py-1 bg-blue-500 text-white rounded"
                    >
                      {t('mappings.rules.edit')}
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.keyword)}
                      className="px-2 py-1 bg-red-500 text-white rounded"
                    >
                      {t('mappings.rules.delete')}
                    </button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>

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
