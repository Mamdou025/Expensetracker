import React, { useState } from 'react';
import { Trash2, AlertTriangle, Plus } from 'lucide-react';

const TagManager = ({
  tags,
  onRefreshTags,
  onCreateTag,
  onDeleteTag
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const handleDeleteTag = async (tagName) => {
    try {
      setIsLoading(true);
      const result = await onDeleteTag(tagName);
      await onRefreshTags();
      setShowDeleteConfirm(null);

      if (result.updatedTransactions > 0) {
        alert(`Tag deleted! ${result.updatedTransactions} transactions were updated.`);
      } else {
        alert('Tag deleted successfully!');
      }
    } catch (error) {
      alert('Failed to delete tag: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      setIsLoading(true);
      await onCreateTag(newTagName.trim());
      await onRefreshTags();
      setNewTagName('');
      setShowAddForm(false);
      alert('Tag created successfully!');
    } catch (error) {
      alert('Failed to create tag: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg text-gray-200">Gérer les balises</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4" />
          Ajouter un nouveau Tag
        </button>
      </div>

      {showAddForm && (
        <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-800">
          <h4 className="font-medium text-blue-300 mb-3">Creer un Nouveau Tag</h4>
          <div className="flex gap-3">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Enter tag name..."
              className="flex-1 border border-gray-700 rounded-md px-3 py-2 bg-gray-800 text-gray-200 focus:ring-1 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateTag();
                if (e.key === 'Escape') {
                  setNewTagName('');
                  setShowAddForm(false);
                }
              }}
              disabled={isLoading}
            />
            <button
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Create
            </button>
            <button
              onClick={() => {
                setNewTagName('');
                setShowAddForm(false);
              }}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors duration-200"
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map((tag) => {
          const tagName = tag.name || tag;
          return (
            <div key={tagName} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div>
                <span className="font-medium text-gray-200">{tagName}</span>
                {tag.transaction_count && (
                  <div className="text-xs text-gray-500">
                    {tag.transaction_count} transactions
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(tagName)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-2 rounded transition-colors duration-200"
                  disabled={isLoading}
                  title="Delete tag from all transactions"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {tags.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 py-8">
          <p>Aucune balise trouvée. Créez une balise ou attribuez-en une aux transactions pour les voir ici !</p>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-semibold text-gray-200">Supprimer le Tag</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer "<strong className="text-gray-200">{showDeleteConfirm}</strong>"?
              <br />
              <span className="text-sm text-red-400 mt-2 block">
                Cela supprimera la balise de toutes les transactions l'utilisant.
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
                onClick={() => handleDeleteTag(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
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

export default TagManager;
