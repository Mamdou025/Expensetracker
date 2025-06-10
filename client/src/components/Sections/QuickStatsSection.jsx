// ===================================

// src/components/sections/QuickStatsSection.jsx
import React from 'react';
import { Hash, DollarSign, Calendar } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
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
        </div>
      </div>
    </div>
  );
};

const QuickStatsSection = ({ quickStats }) => {
  const statCards = [
    {
      icon: Hash,
      label: "Total Transactions",
      value: quickStats.count.toLocaleString(),
      color: "blue"
    },
    {
      icon: DollarSign,
      label: "Total Amount",
      value: `$${quickStats.total.toFixed(2)}`,
      color: "green"
    },
    {
      icon: Calendar,
      label: "Average Amount",
      value: `$${quickStats.average.toFixed(2)}`,
      color: "purple"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default QuickStatsSection;