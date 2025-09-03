// src/components/common/TagEditModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { ruleService } from '../../Services/ruleService';

const TagEditModal = ({ 
  isOpen, 
  onClose, 
  transaction, 
  allAvailableTags, 
  onSave,
  addTag,
  removeTag 
}) => {
  const [currentTags, setCurrentTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize current tags when modal opens
  useEffect(() => {
    if (isOpen && transaction) {
      const transactionTags = transaction.tags 
        ? transaction.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];
      setCurrentTags(transactionTags);
    }
  }, [isOpen, transaction]);

  const handleAddExistingTag = async (tagName) => {
    if (currentTags.includes(tagName)) return;
    
    try {
      setIsLoading(true);
      await addTag(transaction.id, tagName);
      setCurrentTags(prev => [...prev, tagName]);
      if (window.confirm(`Create rule for keyword ${transaction.description}?`)) {
        try {
          await ruleService.create(transaction.description, 'tag', tagName);
        } catch (err) {
          console.error('Failed to create rule:', err);
        }
      }
    } catch (error) {
      console.error('Failed to add tag:', error);
      alert('Failed to add tag. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTag = async (tagName) => {
    try {
      setIsLoading(true);
      await removeTag(transaction.id, tagName);
      setCurrentTags(prev => prev.filter(tag => tag !== tagName));
    } catch (error) {
      console.error('Failed to remove tag:', error);
      alert('Failed to remove tag. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewTag = async () => {
    if (!newTagName.trim() || currentTags.includes(newTagName.trim())) {
      setNewTagName('');
      return;
    }

    try {
      setIsLoading(true);
      await addTag(transaction.id, newTagName.trim());
      setCurrentTags(prev => [...prev, newTagName.trim()]);
      if (window.confirm(`Create rule for keyword ${transaction.description}?`)) {
        try {
          await ruleService.create(transaction.description, 'tag', newTagName.trim());
        } catch (err) {
          console.error('Failed to create rule:', err);
        }
      }
      setNewTagName('');
    } catch (error) {
      console.error('Failed to add new tag:', error);
      alert('Failed to add new tag. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewTagName('');
    onClose();
  };

  const availableTagsToAdd = allAvailableTags.filter(tag => !currentTags.includes(tag));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Tags</h2>
              <p className="text-sm text-gray-600 mt-1">
                {transaction?.description} • ${transaction?.amount?.toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors duration-200"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          
          {/* Current Tags */}
          <div className="mb-8">
            <h3 className="font-medium text-gray-900 mb-3">Current Tags</h3>
            {currentTags.length === 0 ? (
              <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg">
                No tags assigned to this transaction
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {currentTags.map((tag, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-green-200 rounded-full p-1 transition-colors duration-200"
                      disabled={isLoading}
                      title="Remove tag"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Tag */}
          <div className="mb-8">
            <h3 className="font-medium text-gray-900 mb-3">Add New Tag</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter new tag name..."
                className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddNewTag();
                }}
                disabled={isLoading}
              />
              <button
                onClick={handleAddNewTag}
                disabled={!newTagName.trim() || isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>

          {/* Available Tags */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">
              Available Tags 
              <span className="text-sm text-gray-500 font-normal">
                ({availableTagsToAdd.length} available)
              </span>
            </h3>
            {availableTagsToAdd.length === 0 ? (
              <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg">
                All available tags are already assigned to this transaction
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableTagsToAdd.map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddExistingTag(tag)}
                    disabled={isLoading}
                    className="px-3 py-2 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-blue-100 hover:text-blue-800 transition-colors duration-200 disabled:opacity-50"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50"
          >
            Close
          </button>
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Saving...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagEditModal;