import React from 'react';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ExpandableSection from '../common/ExpandableSection';

const TimeChartSection = ({ 
  isExpanded, 
  onToggle, 
  chartData, 
  chartType 
}) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-xl shadow-lg">
          <p className="font-semibold">{`Date: ${label}`}</p>
          <p className="text-blue-600">{`Amount: $${payload[0].value.toFixed(2)}`}</p>
          <p className="text-gray-600">{`Transactions: ${payload[0].payload.count}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ExpandableSection
      title="Transactions Over Time"
      icon={BarChart3}
      isExpanded={isExpanded}
      onToggle={onToggle}
      className="mb-8"
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </ExpandableSection>
  );
};

export default TimeChartSection;
