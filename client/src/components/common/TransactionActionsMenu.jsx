// src/components/common/TransactionActionsMenu.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit3, Tag, Trash2, DollarSign, FileText, Folder } from 'lucide-react';

const TransactionActionsMenu = ({ 
  transaction, 
  onStartEdit, 
  onOpenTagModal, 
  onDeleteTransaction,
  removeTag 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action) => {
    setIsOpen(false);
    
    switch(action) {
      case 'edit-amount':
        onStartEdit(transaction, 'amount');
        break;
      case 'edit-description':
        onStartEdit(transaction, 'description');
        break;
      case 'edit-category':
        onStartEdit(transaction, 'category');
        break;
      case 'edit-tags':
        onOpenTagModal(transaction);
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this transaction?')) {
          onDeleteTransaction(transaction.id);
        }
        break;
      default:
        break;
    }
  };

  const quickRemoveTag = async (tag) => {
    setIsOpen(false);
    if (window.confirm(`Remove "${tag}" from this transaction?`)) {
      try {
        await removeTag(transaction.id, tag);
      } catch (error) {
        alert('Failed to remove tag: ' + error.message);
      }
    }
  };

  const transactionTags = transaction.tags 
    ? transaction.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    : [];

  return (
    <div className="relative" ref={menuRef}>
      {/* Three dots button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
        title="Transaction actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-8 mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          
          {/* Edit Actions */}
          <div className="px-3 py-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Edit</p>
          </div>
          
          <button
            onClick={() => handleAction('edit-amount')}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
          >
            <DollarSign className="w-4 h-4 text-green-600" />
            <div>
              <div className="font-medium">Edit Amount</div>
              <div className="text-xs text-gray-500">${transaction.amount.toFixed(2)}</div>
            </div>
          </button>

          <button
            onClick={() => handleAction('edit-description')}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <div>
              <div className="font-medium">Edit Description</div>
              <div className="text-xs text-gray-500 truncate">{transaction.description}</div>
            </div>
          </button>

          <button
            onClick={() => handleAction('edit-category')}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
          >
            <Folder className="w-4 h-4 text-purple-600" />
            <div>
              <div className="font-medium">Edit Category</div>
              <div className="text-xs text-gray-500">{transaction.category || 'No category'}</div>
            </div>
          </button>

          <button
            onClick={() => handleAction('edit-tags')}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
          >
            <Tag className="w-4 h-4 text-orange-600" />
            <div>
              <div className="font-medium">Manage Tags</div>
              <div className="text-xs text-gray-500">
                {transactionTags.length > 0 ? `${transactionTags.length} tags` : 'No tags'}
              </div>
            </div>
          </button>

          {/* Quick tag removal if tags exist */}
          {transactionTags.length > 0 && (
            <>
              <div className="border-t my-2"></div>
              <div className="px-3 py-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Quick Remove Tags</p>
              </div>
              {transactionTags.slice(0, 3).map((tag, index) => (
                <button
                  key={index}
                  onClick={() => quickRemoveTag(tag)}
                  className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-sm"
                >
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <div>
                    <div className="font-medium text-red-600">Remove "{tag}"</div>
                  </div>
                </button>
              ))}
              {transactionTags.length > 3 && (
                <div className="px-4 py-2 text-xs text-gray-500">
                  +{transactionTags.length - 3} more tags...
                </div>
              )}
            </>
          )}

          {/* Delete Action */}
          <div className="border-t my-2"></div>
          <button
            onClick={() => handleAction('delete')}
            className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-sm text-red-600"
          >
            <Trash2 className="w-4 h-4" />
            <div className="font-medium">Delete Transaction</div>
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionActionsMenu;