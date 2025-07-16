// src/components/Settings/CategoryManager.jsx - Simplified View-Only Version
import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

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
      
      // Show success message with transaction count
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
        <h3 className="font-semibold text-lg">Manage Categories</h3>
      </div>

     

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const categoryName = category.name || category;
          return (
            <div key={categoryName} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
              <div>
                <span className="font-medium">{categoryName}</span>
                {category.transaction_count && (
                  <div className="text-xs text-gray-500">
                    {category.transaction_count} transactions • ${category.total_amount?.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(categoryName)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-100 p-2 rounded transition-colors duration-200"
                  disabled={isLoading}
                  title="Delete category from all transactions"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {categories.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 py-8">
          <p>No categories found. Assign categories to transactions to see them here!</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold">Delete Category</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<strong>{showDeleteConfirm}</strong>"? 
              <br />
              <span className="text-sm text-red-600 mt-2 block">
                This will remove the category from all transactions using it.
              </span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCategory(showDeleteConfirm)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
          Processing...
        </div>
      )}
    </div>
  );
};

export default CategoryManager;