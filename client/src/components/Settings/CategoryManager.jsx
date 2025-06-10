import React from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

const CategoryManager = ({ 
  categories, 
  setCategories, 
  editingItem, 
  setEditingItem, 
  newItemName, 
  setNewItemName, 
  onAddItem, 
  onEditItem, 
  onDeleteItem 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Manage Categories</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="New category name"
            className="border rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => onAddItem('category')}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div key={category} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            {editingItem === `category-${category}` ? (
              <div className="flex gap-2 w-full">
                <input
                  type="text"
                  defaultValue={category}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      onEditItem('category', category, e.target.value);
                    }
                  }}
                  className="flex-1 border rounded-lg px-2 py-1 text-sm"
                  autoFocus
                />
                <button
                  onClick={(e) => {
                    const input = e.target.parentElement.querySelector('input');
                    onEditItem('category', category, input.value);
                  }}
                  className="text-green-600 hover:text-green-800"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingItem(null)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <span className="font-medium">{category}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingItem(`category-${category}`)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteItem('category', category)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManager;
