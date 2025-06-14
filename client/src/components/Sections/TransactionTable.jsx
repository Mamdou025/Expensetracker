// src/components/Sections/TransactionTable.jsx
import React from 'react';

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
  onOpenTagModal
}) => {
  const isEditing = (field) => editingTransaction === `${transaction.id}-${field}`;
  
  return (
    <tr className="hover:bg-gray-50 transition-colors duration-200">
      {/* Date - Read only */}
      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-900">
        {transaction.date}
      </td>
      
      {/* Description - Editable */}
      <td className="px-8 py-6 text-sm text-gray-900">
        {isEditing('description') ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editValues.description || ''}
              onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit(transaction, 'description');
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
            <button
              onClick={() => onSaveEdit(transaction, 'description')}
              className="px-2 py-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
              title="Save"
            >
              ✓
            </button>
            <button
              onClick={onCancelEdit}
              className="px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            onClick={() => onStartEdit(transaction, 'description')}
            className="cursor-pointer hover:bg-blue-50 p-2 rounded-lg transition-colors duration-200"
            title="Click to edit description"
          >
            {transaction.description}
          </div>
        )}
      </td>
      
      {/* Amount - Editable */}
      <td className="px-8 py-6 whitespace-nowrap text-sm font-medium text-gray-900">
        {isEditing('amount') ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              value={editValues.amount || ''}
              onChange={(e) => setEditValues(prev => ({ ...prev, amount: e.target.value }))}
              className="w-28 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit(transaction, 'amount');
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
            <button
              onClick={() => onSaveEdit(transaction, 'amount')}
              className="px-2 py-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
              title="Save"
            >
              ✓
            </button>
            <button
              onClick={onCancelEdit}
              className="px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            onClick={() => onStartEdit(transaction, 'amount')}
            className="cursor-pointer hover:bg-blue-50 p-2 rounded-lg transition-colors duration-200"
            title="Click to edit amount"
          >
            ${transaction.amount.toFixed(2)}
          </div>
        )}
      </td>
      
      {/* Category - Enhanced Dropdown with Add New */}
      <td className="px-8 py-6 whitespace-nowrap">
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
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus={!editValues.isAddingNew}
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="__ADD_NEW__">+ Add New Category</option>
            </select>
            
            {editValues.isAddingNew && (
              <input
                type="text"
                value={editValues.category || ''}
                onChange={(e) => setEditValues(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Enter new category name"
                className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="px-2 py-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded disabled:opacity-50"
              title="Save"
            >
              ✓
            </button>
            <button
              onClick={onCancelEdit}
              className="px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onStartEdit(transaction, 'category')}
              className={`px-3 py-2 text-xs rounded-full transition-all duration-200 hover:shadow-md ${
                transaction.category 
                  ? filters.categories.includes(transaction.category)
                    ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-blue-50'
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
              }`}
              title="Click to edit category"
            >
              {transaction.category || 'No Category'}
            </button>
            
            {transaction.category && (
              <button
                onClick={() => {
                  if (window.confirm(`Remove "${transaction.category}" from this transaction?`)) {
                    onSaveEdit({ ...transaction, category: null }, 'category');
                  }
                }}
                className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1 rounded transition-colors duration-200"
                title="Remove category"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </td>
      
      {/* Tags - Enhanced with quick delete */}
      <td className="px-8 py-6 whitespace-nowrap">
        <div className="flex flex-wrap gap-1 items-center">
          {transaction.tags && transaction.tags.split(',').map(tag => tag.trim()).filter(tag => tag).map((tag, index) => (
            <div key={index} className="flex items-center gap-1">
              <span
                className={`px-2 py-1 text-xs rounded-full transition-all duration-200 ${
                  filters.tags.includes(tag)
                    ? 'bg-green-100 text-green-800 ring-2 ring-green-200'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {tag}
              </span>
              <button
                onClick={async () => {
                  if (window.confirm(`Remove "${tag}" from this transaction?`)) {
                    try {
                      await removeTag(transaction.id, tag);
                    } catch (error) {
                      alert('Failed to remove tag: ' + error.message);
                    }
                  }
                }}
                className="text-red-500 hover:text-red-700 hover:bg-red-100 w-4 h-4 rounded-full flex items-center justify-center text-xs transition-colors duration-200"
                title="Remove tag"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => onOpenTagModal ? onOpenTagModal(transaction) : onStartEdit(transaction, 'tags')}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors duration-200"
            title="Add/Edit tags"
          >
            ✏️ Edit
          </button>
        </div>
      </td>
      
      {/* Bank - Read only */}
      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600">
        {transaction.bank}
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
}) => {
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  return (
    <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b bg-gray-50">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-xl">
            Transactions ({filteredTransactions.length})
            {editingTransaction && (
              <span className="ml-2 text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                ✏️ Editing
              </span>
            )}
          </h3>
          <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-xl border">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
              <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  onClick={() => onSort('date')} 
                  className="flex items-center gap-1 hover:text-gray-700 transition-colors duration-200"
                >
                  Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  onClick={() => onSort('description')} 
                  className="flex items-center gap-1 hover:text-gray-700 transition-colors duration-200"
                >
                  Description {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  onClick={() => onSort('amount')} 
                  className="flex items-center gap-1 hover:text-gray-700 transition-colors duration-200"
                >
                  Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  onClick={() => onSort('category')} 
                  className="flex items-center gap-1 hover:text-gray-700 transition-colors duration-200"
                >
                  Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags ✏️
              </th>
              <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bank
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
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
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-8 py-6 border-t bg-gray-50 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTransactions.length)} to{' '}
          {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} results
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors duration-200"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 border rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors duration-200"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionTable;