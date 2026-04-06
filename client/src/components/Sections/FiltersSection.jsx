import React, { useMemo } from 'react';
import { Filter } from 'lucide-react';
import ExpandableSection from '../common/ExpandableSection';
import { useTranslation } from 'react-i18next';
import { getCategoryColor } from '../../utils/categoryColors';

const FiltersSection = ({
  isExpanded,
  onToggle,
  filters,
  onFilterChange,
  onMultiSelectFilter,
  uniqueCategories,
  uniqueTags,
  uniqueCardTypes,
  transactions
}) => {
  const { t } = useTranslation();

  const fmt = (d) => d.toISOString().split('T')[0];
  const now = new Date();
  const yr = now.getFullYear();
  const mo = now.getMonth();

  const availableYears = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    const years = new Set();
    transactions.forEach(tx => {
      if (tx.date) {
        const y = parseInt(tx.date.substring(0, 4), 10);
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const ago12 = new Date(now);
  ago12.setFullYear(ago12.getFullYear() - 1);

  const presets = [
    { label: t('filters.presets.thisMonth'), from: fmt(new Date(yr, mo, 1)), to: fmt(new Date(yr, mo + 1, 0)) },
    { label: t('filters.presets.lastMonth'), from: fmt(new Date(yr, mo - 1, 1)), to: fmt(new Date(yr, mo, 0)) },
    { label: t('filters.presets.last3Months'), from: fmt(new Date(yr, mo - 2, 1)), to: fmt(now) },
    { label: t('filters.presets.last6Months'), from: fmt(new Date(yr, mo - 5, 1)), to: fmt(now) },
    { label: t('filters.presets.ytd'), from: `${yr}-01-01`, to: fmt(now) },
    { label: t('filters.presets.last12Months'), from: fmt(ago12), to: fmt(now) },
  ];

  const yearPresets = availableYears.map(y => ({
    label: String(y), from: `${y}-01-01`, to: `${y}-12-31`
  }));

  const allPresets = [...presets, ...yearPresets];

  const applyPreset = (from, to) => {
    onFilterChange('dateFrom', from);
    onFilterChange('dateTo', to);
  };

  const clearDates = () => {
    onFilterChange('dateFrom', '');
    onFilterChange('dateTo', '');
  };

  const isActive = (p) => filters.dateFrom === p.from && filters.dateTo === p.to;

  return (
    <ExpandableSection
      title={t('filters.title')}
      icon={Filter}
      isExpanded={isExpanded}
      onToggle={onToggle}
      className="mb-4"
    >
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-400 mb-2.5">{t('filters.dateRange')}</label>
        <div className="flex flex-wrap gap-2">
          {allPresets.map((p) => (
            <button
              key={p.label}
              onClick={() => isActive(p) ? clearDates() : applyPreset(p.from, p.to)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                isActive(p)
                  ? 'nav-active border-transparent'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('filters.dateFrom')}</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange('dateFrom', e.target.value)}
            className="w-full border border-gray-700 rounded-md px-3 py-2 text-sm bg-gray-800 text-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('filters.dateTo')}</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFilterChange('dateTo', e.target.value)}
            className="w-full border border-gray-700 rounded-md px-3 py-2 text-sm bg-gray-800 text-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('filters.minAmount')}</label>
          <input
            type="number"
            step="0.01"
            value={filters.amountMin}
            onChange={(e) => onFilterChange('amountMin', e.target.value)}
            className="w-full border border-gray-700 rounded-md px-3 py-2 text-sm bg-gray-800 text-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('filters.maxAmount')}</label>
          <input
            type="number"
            step="0.01"
            value={filters.amountMax}
            onChange={(e) => onFilterChange('amountMax', e.target.value)}
            className="w-full border border-gray-700 rounded-md px-3 py-2 text-sm bg-gray-800 text-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            placeholder="999.99"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('filters.keyword')}</label>
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => onFilterChange('keyword', e.target.value)}
            className="w-full border border-gray-700 rounded-md px-3 py-2 text-sm bg-gray-800 text-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            placeholder={t('filters.searchPlaceholder')}
          />
        </div>

      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-400 mb-3">{t('filters.categories')}</label>
        <div className="flex flex-wrap gap-2">
          {uniqueCategories.map((category, i) => {
            const color = getCategoryColor(category, i);
            const isActive = filters.categories.includes(category);
            return (
              <button
                key={category}
                onClick={() => onMultiSelectFilter('categories', category)}
                className={`px-3 py-1 rounded-md text-sm border transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'border-transparent'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
                }`}
                style={isActive ? { backgroundColor: color + '25', color: color, borderColor: color + '60' } : {}}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-400 mb-3">{t('filters.tags')}</label>
        <div className="flex flex-wrap gap-3">
          {uniqueTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onMultiSelectFilter('tags', tag)}
              className={`px-3 py-1 rounded-md text-sm border transition-colors ${
                filters.tags.includes(tag)
                  ? 'nav-active border-transparent'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-400 mb-3">{t('filters.banks')}</label>
        <div className="flex flex-wrap gap-3">
          {uniqueCardTypes.map((bank) => (
            <button
              key={bank}
              onClick={() => onMultiSelectFilter('banks', bank)}
              className={`px-3 py-1 rounded-md text-sm border transition-colors ${
                filters.banks && filters.banks.includes(bank)
                  ? 'nav-active border-transparent'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
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
