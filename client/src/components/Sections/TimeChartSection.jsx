// src/components/Sections/TimeChartSection.jsx
import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import ExpandableSection from '../common/ExpandableSection';

const TimeChartSection = ({ 
  isExpanded, 
  onToggle, 
  chartData, 
  chartType,
  timeGrouping = 'daily',
  showCategoryBreakdown = 'none'
}) => {
  
  // Generate category colors dynamically
  const categoryColors = useMemo(() => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1',
      '#14B8A6', '#F87171', '#34D399', '#FBBF24', '#A78BFA'
    ];
    
    const categories = new Set();
    chartData.forEach(item => {
      if (item.categories) {
        Object.keys(item.categories).forEach(cat => categories.add(cat));
      }
    });
    
    const categoryColorMap = {};
    Array.from(categories).forEach((category, index) => {
      categoryColorMap[category] = colors[index % colors.length];
    });
    
    return categoryColorMap;
  }, [chartData]);

  // Format date labels based on time grouping
  const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    
    switch (timeGrouping) {
      case 'weekly':
        return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'monthly':
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      case 'yearly':
        return date.getFullYear().toString();
      default: // daily
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Enhanced tooltip for category breakdown
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-white p-4 border rounded-xl shadow-lg min-w-48">
          <p className="font-semibold mb-2">{formatDateLabel(label)}</p>
          
          {showCategoryBreakdown === 'none' ? (
            <>
              <p className="text-blue-600">{`Total: $${payload[0].value.toFixed(2)}`}</p>
              <p className="text-gray-600">{`Transactions: ${data.count}`}</p>
            </>
          ) : (
            <>
              <p className="text-blue-600 font-medium mb-2">{`Total: $${data.amount.toFixed(2)}`}</p>
              <p className="text-gray-600 mb-2">{`Transactions: ${data.count}`}</p>
              
              {data.categories && (
                <div className="border-t pt-2">
                  <p className="text-xs text-gray-500 mb-1">Categories:</p>
                  {Object.entries(data.categories).map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: categoryColors[category] }}
                        ></div>
                        <span>{category}</span>
                      </div>
                      <span className="font-medium">${amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  // Render stacked bars for category breakdown
  const renderStackedBars = () => {
    const categories = Object.keys(categoryColors);
    
    return categories.map(category => (
      <Bar 
        key={category}
        dataKey={`categories.${category}`}
        stackId="categories"
        fill={categoryColors[category]}
        radius={category === categories[categories.length - 1] ? [4, 4, 0, 0] : [0, 0, 0, 0]}
      />
    ));
  };

  // Prepare data for proportional view (convert to percentages)
  const proportionalData = useMemo(() => {
    if (showCategoryBreakdown !== 'proportional') return chartData;
    
    return chartData.map(item => {
      if (!item.categories) return item;
      
      const total = item.amount;
      const proportionalCategories = {};
      
      Object.entries(item.categories).forEach(([category, amount]) => {
        proportionalCategories[category] = (amount / total) * 100;
      });
      
      return {
        ...item,
        categories: proportionalCategories
      };
    });
  }, [chartData, showCategoryBreakdown]);

  const renderChart = () => {
    const data = showCategoryBreakdown === 'proportional' ? proportionalData : chartData;
    
    if (chartType === 'area') {
      return (
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDateLabel}
            angle={timeGrouping === 'daily' ? -45 : 0}
            textAnchor={timeGrouping === 'daily' ? 'end' : 'middle'}
            height={timeGrouping === 'daily' ? 60 : 30}
          />
          <YAxis tickFormatter={(value) => showCategoryBreakdown === 'proportional' ? `${value.toFixed(0)}%` : `$${value}`} />
          <Tooltip content={<CustomTooltip />} />
          
          {showCategoryBreakdown === 'stacked' || showCategoryBreakdown === 'proportional' ? (
            Object.keys(categoryColors).map(category => (
              <Area
                key={category}
                type="monotone"
                dataKey={`categories.${category}`}
                stackId="categories"
                stroke={categoryColors[category]}
                fill={categoryColors[category]}
                fillOpacity={0.8}
              />
            ))
          ) : (
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke="#3B82F6" 
              fill="#3B82F6" 
              fillOpacity={0.6}
            />
          )}
        </AreaChart>
      );
    }
    
    if (chartType === 'bar') {
      return (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDateLabel}
            angle={timeGrouping === 'daily' ? -45 : 0}
            textAnchor={timeGrouping === 'daily' ? 'end' : 'middle'}
            height={timeGrouping === 'daily' ? 60 : 30}
          />
          <YAxis tickFormatter={(value) => showCategoryBreakdown === 'proportional' ? `${value.toFixed(0)}%` : `$${value}`} />
          <Tooltip content={<CustomTooltip />} />
          
          {showCategoryBreakdown === 'stacked' || showCategoryBreakdown === 'proportional' ? (
            renderStackedBars()
          ) : (
            <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          )}
        </BarChart>
      );
    }
    
    // Line chart
    return (
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDateLabel}
          angle={timeGrouping === 'daily' ? -45 : 0}
          textAnchor={timeGrouping === 'daily' ? 'end' : 'middle'}
          height={timeGrouping === 'daily' ? 60 : 30}
        />
        <YAxis tickFormatter={(value) => showCategoryBreakdown === 'proportional' ? `${value.toFixed(0)}%` : `$${value}`} />
        <Tooltip content={<CustomTooltip />} />
        
        {showCategoryBreakdown === 'stacked' || showCategoryBreakdown === 'proportional' ? (
          Object.keys(categoryColors).map(category => (
            <Line
              key={category}
              type="monotone"
              dataKey={`categories.${category}`}
              stroke={categoryColors[category]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))
        ) : (
          <Line 
            type="monotone" 
            dataKey="amount" 
            stroke="#3B82F6" 
            strokeWidth={3} 
            dot={{ r: 4 }} 
          />
        )}
      </LineChart>
    );
  };

  // Chart title based on current settings
  const getChartTitle = () => {
    const timeText = {
      daily: 'Daily',
      weekly: 'Weekly', 
      monthly: 'Monthly',
      yearly: 'Yearly'
    }[timeGrouping];
    
    const breakdownText = {
      none: '',
      stacked: ' (by Category)',
      proportional: ' (Proportional by Category)'
    }[showCategoryBreakdown];
    
    return `${timeText} Transactions${breakdownText}`;
  };

  return (
    <ExpandableSection
      title={getChartTitle()}
      icon={BarChart3}
      isExpanded={isExpanded}
      onToggle={onToggle}
      className="mb-8"
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      
      {/* Category Legend for breakdown views */}
      {(showCategoryBreakdown === 'stacked' || showCategoryBreakdown === 'proportional') && (
        <div className="mt-4 flex flex-wrap gap-4 justify-center">
          {Object.entries(categoryColors).map(([category, color]) => (
            <div key={category} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-sm text-gray-600">{category}</span>
            </div>
          ))}
        </div>
      )}
    </ExpandableSection>
  );
};

export default TimeChartSection;