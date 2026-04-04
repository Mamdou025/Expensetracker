import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { keywordMappingService } from '../../Services/keywordMappingService';

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
  const { t } = useTranslation();

  const promptAndSaveRule = async (updatedTags) => {
    if (window.confirm(t('tagEdit.saveKeywordRulePrompt'))) {
      try {
        await keywordMappingService.createRule(transaction.description, null, updatedTags);
        alert(t('tagEdit.keywordRuleSuccess'));
      } catch (err) {
        alert(t('tagEdit.keywordRuleError'));
      }
    }
  };

  useEffect(() => {
    if (isOpen && transaction) {
      const transactionTags = Array.isArray(transaction.tags) ? transaction.tags : [];
      setCurrentTags(transactionTags);
    }
  }, [isOpen, transaction]);

  const handleAddExistingTag = async (tagName) => {
    if (currentTags.includes(tagName)) return;

    try {
      setIsLoading(true);
      await addTag(transaction.id, tagName);
      const updatedTags = [...currentTags, tagName];
      setCurrentTags(updatedTags);
      await promptAndSaveRule(updatedTags);
    } catch (error) {
      alert('Failed to add tag. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTag = async (tagName) => {
    try {
      setIsLoading(true);
      await removeTag(transaction.id, tagName);
      const updatedTags = currentTags.filter(tag => tag !== tagName);
      setCurrentTags(updatedTags);
      await promptAndSaveRule(updatedTags);
    } catch (error) {
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
      const updatedTags = [...currentTags, newTagName.trim()];
      setCurrentTags(updatedTags);
      setNewTagName('');
      await promptAndSaveRule(updatedTags);
    } catch (error) {
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700">

        <div className="p-6 border-b border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-100">Gerer les Tags</h2>
              <p className="text-sm text-gray-400 mt-1">
                {transaction?.description} • ${transaction?.amount?.toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors duration-200 text-gray-400"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">

          <div className="mb-8">
            <h3 className="font-medium text-gray-200 mb-3">Tags disponibles</h3>
            {currentTags.length === 0 ? (
              <p className="text-gray-500 text-sm bg-gray-800 p-4 rounded-lg">
                Aucun tag n'est associé à cette transaction
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {currentTags.map((tag, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-900/30 text-emerald-300 rounded-full text-sm border border-emerald-800"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-emerald-800/50 rounded-full p-1 transition-colors duration-200"
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

          <div className="mb-8">
            <h3 className="font-medium text-gray-200 mb-3">Ajouter un nouveau tag</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Entrer un nom de tag..."
                className="flex-1 border border-gray-700 rounded-md px-4 py-2 bg-gray-800 text-gray-200 focus:ring-1 focus:ring-gray-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddNewTag();
                }}
                disabled={isLoading}
              />
              <button
                onClick={handleAddNewTag}
                disabled={!newTagName.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-200 mb-3">
              Tags Disponibles{' '}
              <span className="text-sm text-gray-500 font-normal">
                ({availableTagsToAdd.length} disponibles)
              </span>
            </h3>
            {availableTagsToAdd.length === 0 ? (
              <p className="text-gray-500 text-sm bg-gray-800 p-4 rounded-lg">
                Tous les tags disponibles sont déjà associés à cette transaction.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableTagsToAdd.map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddExistingTag(tag)}
                    disabled={isLoading}
                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-full text-sm hover:bg-gray-700 hover:text-gray-100 border border-gray-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50"
          >
            Close
          </button>
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span className="text-sm">Enregistrement...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagEditModal;
