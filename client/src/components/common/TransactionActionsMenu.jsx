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
        <div 
          className="absolute top-8 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50" 
          style={{ 
            right: '0px', 
            transform: 'translateX(calc(-40% + 50px))' 
          }}
        >
          
          <button
            onClick={() => handleAction('edit-amount')}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm transition-colors duration-200"
          >
            <DollarSign className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-900">Edit Amount</span>
          </button>

          <button
            onClick={() => handleAction('edit-description')}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm transition-colors duration-200"
          >
            <FileText className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-900">Edit Description</span>
          </button>

          <button
            onClick={() => handleAction('edit-category')}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm transition-colors duration-200"
          >
            <Folder className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-900">Edit Category</span>
          </button>

          <button
            onClick={() => handleAction('edit-tags')}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm transition-colors duration-200"
          >
            <Tag className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-900">Manage Tags</span>
          </button>

          {/* Divider */}
          <div className="border-t my-2"></div>

          {/* Delete Action */}
          <button
            onClick={() => handleAction('delete')}
            className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-sm transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span className="font-medium text-red-600">Delete Transaction</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionActionsMenu;