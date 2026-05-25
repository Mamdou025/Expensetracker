import React from 'react';
import { useTranslation } from 'react-i18next';
import { Brand, I } from '../../ui/BrandIcon';

const StatCard = ({ iconName, label, value, subtitle }) => {
  return (
    <div className="bg-gray-900 px-5 py-4 rounded-lg border border-gray-800">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-800 rounded-md">
          <Brand name={iconName} size={20} className="text-gray-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-xl font-semibold text-gray-100 mt-0.5">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

const QuickStatsSection = ({ quickStats }) => {
  const { t } = useTranslation();

  const statCards = [
    {
      iconName: I.hash,
      label: t('quickStats.totalTransactions'),
      value: quickStats.count.toLocaleString(),
      subtitle: quickStats.incomeCount > 0
        ? `${quickStats.expenseCount} ${t('quickStats.expenses')}, ${quickStats.incomeCount} ${t('quickStats.deposits')}`
        : undefined,
    },
    {
      iconName: I.dollar,
      label: t('quickStats.totalSpending'),
      value: `$${quickStats.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      iconName: I.trendDown,
      label: t('quickStats.averageExpense'),
      value: `$${quickStats.average.toFixed(2)}`,
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default QuickStatsSection;
