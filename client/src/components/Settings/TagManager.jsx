import React from 'react';
import { Plus, Edit2, Trash2, Save, X, Tag } from 'lucide-react';

const TagManager = ({ 
  tags, 
  setTags, 
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
        <h3 className="font-semibold text-lg">Manage Tags</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="New tag name"
            className="border rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => onAddItem('tag')}
            className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <div key={tag} className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
            {editingItem === `tag-${tag}` ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  defaultValue={tag}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      onEditItem('tag', tag, e.target.value);
                    }
                  }}
                  className="border rounded-lg px-2 py-1 text-sm"
                  autoFocus
                />
                <button
                  onClick={(e) => {
                    const input = e.target.parentElement.querySelector('input');
                    onEditItem('tag', tag, input.value);
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
                <Tag className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">{tag}</span>
                <button
                  onClick={() => setEditingItem(`tag-${tag}`)}
                  className="text-green-600 hover:text-green-800"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDeleteItem('tag', tag)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagManager;