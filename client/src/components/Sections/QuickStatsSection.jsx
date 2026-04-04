// ===================================

// src/components/sections/QuickStatsSection.jsx
import React from 'react';
import { Hash, DollarSign, Calendar, ArrowDownCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const StatCard = ({ icon: Icon, label, value, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    emerald: 'bg-emerald-100 text-emerald-600'
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border">
      <div className="flex items-center gap-4">
        <div className={`p-4 ${colorClasses[color]} rounded-2xl`}>
          <Icon className="w-8 h-8" />
        </div>
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
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
      icon: Hash,
      label: t('quickStats.totalTransactions'),
      value: quickStats.count.toLocaleString(),
      subtitle: quickStats.incomeCount > 0
        ? `${quickStats.expenseCount} ${t('quickStats.expenses')}, ${quickStats.incomeCount} ${t('quickStats.deposits')}`
        : undefined,
      color: 'blue'
    },
    {
      icon: DollarSign,
      label: t('quickStats.totalSpending'),
      value: `$${quickStats.total.toFixed(2)}`,
      color: 'green'
    },
    {
      icon: ArrowDownCircle,
      label: t('quickStats.totalDeposits'),
      value: `$${quickStats.totalIncome.toFixed(2)}`,
      color: 'emerald'
    },
    {
      icon: Calendar,
      label: t('quickStats.averageExpense'),
      value: `$${quickStats.average.toFixed(2)}`,
      color: 'purple'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default QuickStatsSection;