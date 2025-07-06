// src/components/Sections/FiltersSection.jsx
import React from 'react';
import { Filter } from 'lucide-react';
import ExpandableSection from '../common/ExpandableSection';
import { useTranslation } from 'react-i18next';

const FiltersSection = ({ 
  isExpanded, 
  onToggle, 
  filters, 
  onFilterChange,
  onMultiSelectFilter,
  uniqueCategories,
  uniqueTags,
  uniqueCardTypes  // ← ADDED
}) => {
  const { t } = useTranslation();

  return (
    <ExpandableSection
      title={t('filters.title')}
      icon={Filter}
      isExpanded={isExpanded}
      onToggle={onToggle}
      className="mb-8"
    >
      {/* Filter inputs grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">{t('filters.dateFrom')}</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange('dateFrom', e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">{t('filters.dateTo')}</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFilterChange('dateTo', e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">{t('filters.minAmount')}</label>
          <input
            type="number"
            step="0.01"
            value={filters.amountMin}
            onChange={(e) => onFilterChange('amountMin', e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">{t('filters.maxAmount')}</label>
          <input
            type="number"
            step="0.01"
            value={filters.amountMax}
            onChange={(e) => onFilterChange('amountMax', e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="999.99"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">{t('filters.keyword')}</label>
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => onFilterChange('keyword', e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t('filters.searchPlaceholder')}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">{t('filters.categories')}</label>
          <div className="max-h-32 overflow-y-auto border rounded-xl p-3 bg-gray-50">
            {uniqueCategories.map((category) => (
              <label key={category} className="flex items-center gap-2 text-sm mb-2">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category)}
                  onChange={() => onMultiSelectFilter('categories', category)}
                  className="rounded"
                />
                {category}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="mt-6">
        <label className="block text-sm font-medium mb-3">{t('filters.tags')}</label>
        <div className="flex flex-wrap gap-3">
          {uniqueTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onMultiSelectFilter('tags', tag)}
              className={`px-4 py-2 rounded-full text-sm border transition-all duration-200 ${
                filters.tags.includes(tag)
                  ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

{/* Banks - UPDATED SECTION */}
<div className="mt-6">
  <label className="block text-sm font-medium mb-3">{t('filters.banks')}</label>
  <div className="flex flex-wrap gap-3">
    {uniqueCardTypes.map((bank) => (
      <button
        key={bank}
        onClick={() => onMultiSelectFilter('banks', bank)}  // ← CHANGED TO 'banks'
        className={`px-4 py-2 rounded-full text-sm border transition-all duration-200 ${
          filters.banks && filters.banks.includes(bank)      // ← CHANGED TO 'banks'
            ? 'bg-purple-500 text-white border-purple-500 shadow-lg'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        {bank}
      </button>
    ))}
  </div>
</div>
    </ExpandableSection>
  );
};

export default FiltersSection;