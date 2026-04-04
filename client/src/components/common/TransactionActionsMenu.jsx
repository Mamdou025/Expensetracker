import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Tag, Trash2, DollarSign, FileText, Folder, Mail } from 'lucide-react';

const TransactionActionsMenu = ({
  transaction,
  onStartEdit,
  onOpenTagModal,
  onDeleteTransaction,
  onViewEmail,
  removeTag
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

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
      case 'view-email':
        if (onViewEmail) onViewEmail(transaction);
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-full transition-colors duration-200"
        title="Transaction actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className="absolute top-8 mt-1 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 z-50"
          style={{
            right: '0px',
            transform: 'translateX(calc(-40% + 50px))'
          }}
        >
          <button
            onClick={() => handleAction('edit-amount')}
            className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center gap-3 text-sm transition-colors duration-200"
          >
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-200">Modifier Montant</span>
          </button>

          <button
            onClick={() => handleAction('edit-description')}
            className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center gap-3 text-sm transition-colors duration-200"
          >
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-200">Modifier Description</span>
          </button>

          <button
            onClick={() => handleAction('edit-category')}
            className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center gap-3 text-sm transition-colors duration-200"
          >
            <Folder className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-200">Modifier Categorie</span>
          </button>

          <button
            onClick={() => handleAction('edit-tags')}
            className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center gap-3 text-sm transition-colors duration-200"
          >
            <Tag className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-200">Gérer les Tags</span>
          </button>

          <button
            onClick={() => handleAction('view-email')}
            className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center gap-3 text-sm transition-colors duration-200"
          >
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-200">Voir le Email</span>
          </button>

          <div className="border-t border-gray-700 my-2"></div>

          <button
            onClick={() => handleAction('delete')}
            className="w-full px-4 py-3 text-left hover:bg-red-900/30 flex items-center gap-3 text-sm transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span className="font-medium text-red-400">Supprimer </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionActionsMenu;
