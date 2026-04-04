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
      className="mb-4"
    >
      {/* Filter inputs grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">{t('filters.dateFrom')}</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange('dateFrom', e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">{t('filters.dateTo')}</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFilterChange('dateTo', e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">{t('filters.minAmount')}</label>
          <input
            type="number"
            step="0.01"
            value={filters.amountMin}
            onChange={(e) => onFilterChange('amountMin', e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
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
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            placeholder="999.99"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">{t('filters.keyword')}</label>
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => onFilterChange('keyword', e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            placeholder={t('filters.searchPlaceholder')}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">{t('filters.categories')}</label>
          <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
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
              className={`px-3 py-1 rounded-md text-sm border transition-colors ${
                filters.tags.includes(tag)
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
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
        className={`px-3 py-1 rounded-md text-sm border transition-colors ${
          filters.banks && filters.banks.includes(bank)
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
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