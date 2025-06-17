// src/components/Settings/DisplaySettings.jsx
import React from 'react';
import { BarChart3, TrendingUp, Calendar, Layers } from 'lucide-react';

const DisplaySettings = ({ 
  itemsPerPage, 
  setItemsPerPage, 
  chartType, 
  setChartType,
  // New props for enhanced functionality
  timeGrouping,
  setTimeGrouping,
  showCategoryBreakdown,
  setShowCategoryBreakdown
}) => {
    console.log('DisplaySettings received:', { timeGrouping, showCategoryBreakdown });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <h3 className="font-semibold text-lg">Display Settings</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Items per page */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <label className="block text-sm font-medium mb-3 flex items-center gap-2">
            <span>Items per page</span>
          </label>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value={10}>10 items</option>
            <option value={20}>20 items</option>
            <option value={50}>50 items</option>
            <option value={100}>100 items</option>
          </select>
        </div>

        {/* Chart Type */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <label className="block text-sm font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Chart Type</span>
          </label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="bar">📊 Bar Chart</option>
            <option value="line">📈 Line Chart</option>
            <option value="area">📈 Area Chart</option>
          </select>
        </div>

        {/* Time Grouping */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <label className="block text-sm font-medium mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-green-600" />
            <span>Time Grouping</span>
          </label>
          <select
            value={timeGrouping || 'daily'}
            onChange={(e) => setTimeGrouping && setTimeGrouping(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="daily">📅 Daily</option>
            <option value="weekly">📆 Weekly</option>
            <option value="monthly">🗓️ Monthly</option>
            <option value="yearly">📋 Yearly</option>
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Group transactions by time period for chart display
          </p>
        </div>

        {/* Category Breakdown */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <label className="block text-sm font-medium mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Category Breakdown</span>
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="categoryBreakdown"
                value="none"
                checked={!showCategoryBreakdown || showCategoryBreakdown === 'none'}
                onChange={(e) => setShowCategoryBreakdown && setShowCategoryBreakdown('none')}
                className="mr-3 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">📊 Total amounts only</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="categoryBreakdown"
                value="stacked"
                checked={showCategoryBreakdown === 'stacked'}
                onChange={(e) => setShowCategoryBreakdown && setShowCategoryBreakdown('stacked')}
                className="mr-3 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">🏗️ Stacked by category</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="categoryBreakdown"
                value="proportional"
                checked={showCategoryBreakdown === 'proportional'}
                onChange={(e) => setShowCategoryBreakdown && setShowCategoryBreakdown('proportional')}
                className="mr-3 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">📈 Proportional breakdown</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Show category breakdown within each time period
          </p>
        </div>
      </div>

    </div>
  );
};

export default DisplaySettings;