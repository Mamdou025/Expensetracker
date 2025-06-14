// src/components/Settings/TagManager.jsx - Simplified View-Only Version
import React, { useState } from 'react';
import { Trash2, Tag, AlertTriangle, Info } from 'lucide-react';

const TagManager = ({ 
  tags, 
  onRefreshTags,
  onDeleteTag
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const handleDeleteTag = async (tagName) => {
    try {
      setIsLoading(true);
      await onDeleteTag(tagName);
      await onRefreshTags();
      setShowDeleteConfirm(null);
    } catch (error) {
      alert('Failed to delete tag: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Manage Tags</h3>
      </div>

      {/* Tags Display */}
      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => {
          const tagName = tag.name || tag;
          return (
            <div key={tagName} className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
              <Tag className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800">{tagName}</span>
              {tag.usage_count && (
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  {tag.usage_count} uses
                </span>
              )}
              <button
                onClick={() => setShowDeleteConfirm(tagName)}
                className="text-red-600 hover:text-red-800 hover:bg-red-100 p-1 rounded transition-colors duration-200"
                disabled={isLoading}
                title="Delete tag from all transactions"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {tags.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 py-8">
          <Tag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p>No tags found. Use the tag editor on transactions to create tags!</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold">Delete Tag</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<strong>{showDeleteConfirm}</strong>"? 
              <br />
              <span className="text-sm text-red-600 mt-2 block">
                This will remove the tag from all transactions and delete it permanently.
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
                onClick={() => handleDeleteTag(showDeleteConfirm)}
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
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto mb-2"></div>
          Processing...
        </div>
      )}
    </div>
  );
};

export default TagManager;