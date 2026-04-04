import React, { useMemo } from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import ExpandableSection from '../common/ExpandableSection';
import { useTranslation } from 'react-i18next';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1',
  '#14B8A6', '#F87171', '#34D399', '#FBBF24', '#A78BFA',
  '#0EA5E9', '#D946EF', '#22D3EE', '#FB923C', '#A3E635'
];

const CategoryChartSection = ({ 
  isExpanded, 
  onToggle, 
  pieChartData 
}) => {
  const { t } = useTranslation();

  const total = useMemo(() => pieChartData.reduce((s, d) => s + d.value, 0), [pieChartData]);

  const sortedData = useMemo(() => 
    [...pieChartData].sort((a, b) => b.value - a.value),
    [pieChartData]
  );

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const pct = total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-gray-800 p-3 border border-gray-700 rounded-lg shadow-lg text-sm">
          <p className="font-semibold text-gray-200">{payload[0].name}</p>
          <p className="text-blue-400">${payload[0].value.toFixed(2)} ({pct}%)</p>
          <p className="text-gray-400">{payload[0].payload.count} transactions</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ExpandableSection
      title={t('categoryChart.title')}
      icon={PieChartIcon}
      isExpanded={isExpanded}
      onToggle={onToggle}
      className="mb-4"
    >
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="h-72 w-full lg:w-1/2 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sortedData}
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={50}
                dataKey="value"
                paddingAngle={1}
                stroke="none"
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full lg:w-1/2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm py-2">
          {sortedData.map((entry, index) => {
            const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
            return (
              <div key={entry.name} className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-gray-300 truncate">{entry.name}</span>
                <span className="text-gray-500 flex-shrink-0 ml-auto">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </ExpandableSection>
  );
};

export default CategoryChartSection;
