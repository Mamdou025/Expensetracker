import React from 'react';
import { BarChart3, TrendingUp, Calendar, Layers } from 'lucide-react';

const DisplaySettings = ({
  itemsPerPage,
  setItemsPerPage,
  chartType,
  setChartType,
  timeGrouping,
  setTimeGrouping,
  showCategoryBreakdown,
  setShowCategoryBreakdown
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Transactions par page</label>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
            className="w-full border border-gray-700 rounded-md px-3 py-2 text-sm bg-gray-800 text-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          >
            <option value={10}>10 transactions</option>
            <option value={20}>20 transactions</option>
            <option value={50}>50 transactions</option>
            <option value={100}>100 transactions</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-gray-500" />
            Type de graphique
          </label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="w-full border border-gray-700 rounded-md px-3 py-2 text-sm bg-gray-800 text-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          >
            <option value="bar">Graphique a barres</option>
            <option value="line">Graphique lineaire</option>
            <option value="area">Graphique en aires</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            Regroupement par periode
          </label>
          <select
            value={timeGrouping || 'daily'}
            onChange={(e) => setTimeGrouping && setTimeGrouping(e.target.value)}
            className="w-full border border-gray-700 rounded-md px-3 py-2 text-sm bg-gray-800 text-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          >
            <option value="daily">Tous les jours</option>
            <option value="weekly">Hebdomadaire</option>
            <option value="monthly">Mensuelle</option>
            <option value="yearly">Annuelle</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-gray-500" />
            Repartition des categories
          </label>
          <div className="space-y-2 mt-1">
            <label className="flex items-center">
              <input
                type="radio"
                name="categoryBreakdown"
                value="none"
                checked={!showCategoryBreakdown || showCategoryBreakdown === 'none'}
                onChange={() => setShowCategoryBreakdown && setShowCategoryBreakdown('none')}
                className="mr-2"
              />
              <span className="text-sm text-gray-400">Montants total</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="categoryBreakdown"
                value="stacked"
                checked={showCategoryBreakdown === 'stacked'}
                onChange={() => setShowCategoryBreakdown && setShowCategoryBreakdown('stacked')}
                className="mr-2"
              />
              <span className="text-sm text-gray-400">Empiles par categorie</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="categoryBreakdown"
                value="proportional"
                checked={showCategoryBreakdown === 'proportional'}
                onChange={() => setShowCategoryBreakdown && setShowCategoryBreakdown('proportional')}
                className="mr-2"
              />
              <span className="text-sm text-gray-400">Repartition proportionnelle</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplaySettings;
