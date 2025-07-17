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
        <h3 className="font-semibold text-lg">Parametres d'affichage</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Items per page */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <label className="block text-sm font-medium mb-3 flex items-center gap-2">
            <span>transactions par page</span>
          </label>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value={10}>10 transactions</option>
            <option value={20}>20 transactions</option>
            <option value={50}>50 transactions</option>
            <option value={100}>100 transactions</option>
          </select>
        </div>

        {/* Chart Type */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <label className="block text-sm font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Type de graphique</span>
          </label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="bar">📊 Graphique à barres</option>
            <option value="line">📈 Graphique linéaire</option>
            <option value="area">📈 Graphique en aires</option>
          </select>
        </div>

        {/* Time Grouping */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <label className="block text-sm font-medium mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-green-600" />
            <span>Regroupement par periode</span>
          </label>
          <select
            value={timeGrouping || 'daily'}
            onChange={(e) => setTimeGrouping && setTimeGrouping(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="daily">📅 Tous les jours</option>
            <option value="weekly">📆 Hebdomadaire</option>
            <option value="monthly">🗓️ Mensuelle</option>
            <option value="yearly">📋Annuelle </option>
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Regrouper les transactions par période pour l'affichage graphique
          </p>
        </div>

        {/* Category Breakdown */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <label className="block text-sm font-medium mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Répartition des catégories</span>
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
              <span className="text-sm">Montants total</span>
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
              <span className="text-sm">Empilés par catégorie</span>
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
              <span className="text-sm">Répartition proportionnelle</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Afficher la répartition des catégories dans chaque période
          </p>
        </div>
      </div>

    </div>
  );
};

export default DisplaySettings;