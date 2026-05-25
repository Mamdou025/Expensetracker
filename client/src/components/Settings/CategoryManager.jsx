import React, { useState } from 'react';
import { Brand, BrandLine, I } from '../../ui/BrandIcon';

const CategoryManager = ({
  categories,
  onRefreshCategories,
  onDeleteCategory
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const handleDeleteCategory = async (categoryName) => {
    try {
      setIsLoading(true);
      const result = await onDeleteCategory(categoryName);
      await onRefreshCategories();
      setShowDeleteConfirm(null);

      if (result.updatedTransactions > 0) {
        alert(`Category deleted! ${result.updatedTransactions} transactions were updated.`);
      }
    } catch (error) {
      alert('Failed to delete category: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg text-gray-200">Gérer les catégories</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const categoryName = category.name || category;
          return (
            <div key={categoryName} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div>
                <span className="font-medium text-gray-200">{categoryName}</span>
                {category.transaction_count && (
                  <div className="text-xs text-gray-500">
                    {category.transaction_count} transactions • ${category.total_amount?.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(categoryName)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-2 rounded transition-colors duration-200"
                  disabled={isLoading}
                  title="Delete category from all transactions"
                >
                  <Brand name={I.trash} size={16} accent="#f87171" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {categories.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 py-8">
          <p>Aucune catégorie trouvée. Attribuez des catégories aux transactions pour les afficher ici !</p>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Brand name={I.alert} size={24} className="text-red-400" accent="#f87171" />
              <h3 className="text-lg font-semibold text-gray-200">Supprimer la catégorie</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer "<strong className="text-gray-200">{showDeleteConfirm}</strong>"?
              <br />
              <span className="text-sm text-red-400 mt-2 block">
                Cela supprimera la catégorie de toutes les transactions qui l'utilisent.
              </span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteCategory(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Brand name={I.trash} size={16} accent="#f87171" />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2"></div>
          Traitement...
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
