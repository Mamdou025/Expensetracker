import React, { useState } from 'react';
import TransactionActionsMenu from '../common/TransactionActionsMenu';
import EmailViewerModal from '../common/EmailViewerModal';
import { useTranslation } from 'react-i18next';
import { getCategoryColor } from '../../utils/categoryColors';

const FixedTransactionActionsMenu = (props) => {
  return (
    <div className="flex justify-end">
      <div className="relative">
        <TransactionActionsMenu {...props} />
      </div>
    </div>
  );
};

const EditableTransactionRow = ({
  transaction,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  editingTransaction,
  editValues,
  setEditValues,
  categories,
  onMultiSelectFilter,
  removeTag,
  filters,
  onOpenTagModal,
  onDeleteTransaction,
  onViewEmail
}) => {
  const isEditing = (field) => editingTransaction === `${transaction.id}-${field}`;

  return (
    <tr className="hover:bg-gray-700/20 transition-colors duration-200">
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
        {transaction.date}
      </td>

      <td className="px-4 py-3 text-sm text-gray-300">
        {isEditing('description') ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editValues.description || ''}
              onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
              className="flex-1 border border-gray-600 rounded-md px-3 py-2 text-sm bg-gray-800 text-gray-200 focus:ring-1 focus:ring-gray-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit(transaction, 'description');
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
            <button
              onClick={() => onSaveEdit(transaction, 'description')}
              className="px-2 py-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 rounded"
              title="Enregistrer"
            >
              ✓
            </button>
            <button
              onClick={onCancelEdit}
              className="px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
              title="Annuler"
            >
              ✕
            </button>
          </div>
        ) : (
          <span className="text-gray-200">
            {transaction.description}
          </span>
        )}
      </td>

      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
        {isEditing('amount') ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              value={editValues.amount || ''}
              onChange={(e) => setEditValues(prev => ({ ...prev, amount: e.target.value }))}
              className="w-28 border border-gray-600 rounded-md px-3 py-2 text-sm bg-gray-800 text-gray-200 focus:ring-1 focus:ring-gray-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit(transaction, 'amount');
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
            <button
              onClick={() => onSaveEdit(transaction, 'amount')}
              className="px-2 py-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 rounded"
              title="Enregistrer"
            >
              ✓
            </button>
            <button
              onClick={onCancelEdit}
              className="px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
              title="Annuler"
            >
              ✕
            </button>
          </div>
        ) : (
          <span className={`font-medium ${transaction.transaction_type === 'income' ? 'text-emerald-400' : 'text-gray-200'}`}>
            {transaction.transaction_type === 'income' ? '+' : ''}${transaction.amount.toFixed(2)}
          </span>
        )}
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        {isEditing('category') ? (
          <div className="flex items-center gap-2">
            <select
              value={editValues.category || ''}
              onChange={(e) => {
                if (e.target.value === '__ADD_NEW__') {
                  setEditValues(prev => ({ ...prev, category: '', isAddingNew: true }));
                } else {
                  setEditValues(prev => ({ ...prev, category: e.target.value, isAddingNew: false }));
                }
              }}
              className="border border-gray-600 rounded-md px-3 py-2 text-sm bg-gray-800 text-gray-200 focus:ring-1 focus:ring-gray-500"
              autoFocus={!editValues.isAddingNew}
            >
              <option value="">Choisir une catégorie</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="__ADD_NEW__">+ Nouvelle catégorie</option>
            </select>

            {editValues.isAddingNew && (
              <input
                type="text"
                value={editValues.category || ''}
                onChange={(e) => setEditValues(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Nom de la nouvelle catégorie"
                className="border border-gray-600 rounded-md px-3 py-2 text-sm bg-gray-800 text-gray-200 focus:ring-1 focus:ring-gray-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editValues.category.trim()) {
                    onSaveEdit(transaction, 'category');
                  }
                  if (e.key === 'Escape') onCancelEdit();
                }}
              />
            )}

            <button
              onClick={() => onSaveEdit(transaction, 'category')}
              disabled={editValues.isAddingNew && !editValues.category?.trim()}
              className="px-2 py-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 rounded disabled:opacity-50"
              title="Enregistrer"
            >
              ✓
            </button>
            <button
              onClick={onCancelEdit}
              className="px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
              title="Annuler"
            >
              ✕
            </button>
          </div>
        ) : (
          <span
            className="px-3 py-1 text-xs rounded-full"
            style={transaction.category ? (() => {
              const c = getCategoryColor(transaction.category, 0);
              const isFiltered = filters.categories.includes(transaction.category);
              return {
                backgroundColor: c + (isFiltered ? '30' : '18'),
                color: c,
                boxShadow: isFiltered ? `inset 0 0 0 1px ${c}50` : 'none',
              };
            })() : { backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171' }}
          >
            {transaction.category || 'Sans catégorie'}
          </span>
        )}
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex flex-wrap gap-1">
          {Array.isArray(transaction.tags) && transaction.tags.map((tag, index) => (
            <span
              key={`${transaction.id}-${tag}-${index}`}
              className={`px-2 py-1 text-xs rounded-full transition-all duration-200 ${
                filters.tags.includes(tag)
                  ? 'bg-emerald-900/40 text-emerald-300 ring-1 ring-emerald-700'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              {tag}
            </span>
          ))}
          {(!Array.isArray(transaction.tags) || transaction.tags.length === 0) && (
            <span className="px-2 py-1 text-xs rounded-full bg-gray-800 text-gray-600">
              Aucun tag
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
        {transaction.bank}
      </td>

      <td className="px-4 py-3 whitespace-nowrap text-right">
        <FixedTransactionActionsMenu
          transaction={transaction}
          onStartEdit={onStartEdit}
          onOpenTagModal={onOpenTagModal}
          onDeleteTransaction={onDeleteTransaction}
          removeTag={removeTag}
          onViewEmail={onViewEmail}
        />
      </td>
    </tr>
  );
};

const TransactionTable = ({
  transactions,
  filteredTransactions,
  paginatedTransactions,
  sortField,
  sortDirection,
  currentPage,
  itemsPerPage,
  filters,
  onSort,
  onMultiSelectFilter,
  onPageChange,
  editingTransaction,
  editValues,
  setEditValues,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  categories,
  uniqueTags,
  onOpenTagModal,
  removeTag,
  onDeleteTransaction
}) => {
  const { t } = useTranslation();
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalTransaction, setEmailModalTransaction] = useState(null);

  const handleViewEmail = (txn) => {
    setEmailModalTransaction(txn);
    setShowEmailModal(true);
  };

  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
    setEmailModalTransaction(null);
  };

  return (
    <>
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-sm text-gray-400 uppercase tracking-wide">
            {t('transactionTable.transactions')} ({filteredTransactions.length})
            {editingTransaction && (
              <span className="ml-2 text-sm text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
                Modification
              </span>
            )}
          </h3>
          <div className="text-sm text-gray-400 bg-gray-800 px-3 py-1.5 rounded-md border border-gray-700">
            {t('transactionTable.page')} {currentPage} {t('transactionTable.of')} {totalPages}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => onSort('date')}
                  className="flex items-center gap-1 hover:text-gray-300"
                >
                  {t('transactionTable.date')} {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => onSort('description')}
                  className="flex items-center gap-1 hover:text-gray-300"
                >
                  {t('transactionTable.description')} {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => onSort('amount')}
                  className="flex items-center gap-1 hover:text-gray-300"
                >
                  {t('transactionTable.amount')} {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => onSort('category')}
                  className="flex items-center gap-1 hover:text-gray-300"
                >
                  {t('transactionTable.category')} {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('transactionTable.tags')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('transactionTable.bank')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('transactionTable.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {paginatedTransactions.map((transaction) => (
              <EditableTransactionRow
                key={transaction.id}
                transaction={transaction}
                onStartEdit={onStartEdit}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
                editingTransaction={editingTransaction}
                editValues={editValues}
                setEditValues={setEditValues}
                categories={categories}
                onMultiSelectFilter={onMultiSelectFilter}
                filters={filters}
                onOpenTagModal={onOpenTagModal}
                removeTag={removeTag}
                onDeleteTransaction={onDeleteTransaction}
                onViewEmail={handleViewEmail}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-gray-800 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Affichage de {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTransactions.length)} à{' '}
          {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} sur {filteredTransactions.length} résultats
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border border-gray-700 rounded-md text-sm text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
          >
            Précédent
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 border border-gray-700 rounded-md text-sm text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
    <EmailViewerModal
      isOpen={showEmailModal}
      onClose={handleCloseEmailModal}
      transaction={emailModalTransaction}
    />
    </>
  );
};

export default TransactionTable;
