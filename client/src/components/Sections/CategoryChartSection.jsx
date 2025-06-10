import React from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import ExpandableSection from '../common/ExpandableSection';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

const CategoryChartSection = ({ 
  isExpanded, 
  onToggle, 
  pieChartData 
}) => {
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-xl shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-blue-600">{`Amount: $${payload[0].value.toFixed(2)}`}</p>
          <p className="text-gray-600">{`Transactions: ${payload[0].payload.count}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ExpandableSection
      title="Categories Distribution"
      icon={PieChartIcon}
      isExpanded={isExpanded}
      onToggle={onToggle}
      className="mb-8"
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ExpandableSection>
  );
};

export default CategoryChartSection;