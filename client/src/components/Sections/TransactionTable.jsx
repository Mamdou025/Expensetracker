// src/components/table/TransactionTable.jsx
import React from 'react';

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
  onPageChange
}) => {
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  return (
    <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b bg-gray-50">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-xl">Transactions ({filteredTransactions.length})</h3>
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
                Tags
              </th>
              <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bank
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-900">
                  {transaction.date}
                </td>
                <td className="px-8 py-6 text-sm text-gray-900">
                  {transaction.description}
                </td>
                <td className="px-8 py-6 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${transaction.amount.toFixed(2)}
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <button
                    onClick={() => onMultiSelectFilter('categories', transaction.category)}
                    className={`px-3 py-2 text-xs rounded-full transition-all duration-200 ${
                      filters.categories.includes(transaction.category)
                        ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {transaction.category}
                  </button>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  {transaction.tags && (
                    <button
                      onClick={() => onMultiSelectFilter('tags', transaction.tags)}
                      className={`px-3 py-2 text-xs rounded-full transition-all duration-200 ${
                        filters.tags.includes(transaction.tags)
                          ? 'bg-green-100 text-green-800 ring-2 ring-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {transaction.tags}
                    </button>
                  )}
                </td>
                <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600">
                  {transaction.bank}
                </td>
              </tr>
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

