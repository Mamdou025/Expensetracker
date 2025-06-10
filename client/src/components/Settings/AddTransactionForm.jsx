import React from 'react';
import { Plus } from 'lucide-react';

const AddTransactionForm = ({ 
  showAddTransaction, 
  setShowAddTransaction, 
  newTransaction, 
  setNewTransaction, 
  categories, 
  tags, 
  onAddTransaction 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Add New Transaction</h3>
        <button
          onClick={() => setShowAddTransaction(!showAddTransaction)}
          className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      {showAddTransaction && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-gray-50 rounded-xl">
          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <input
              type="number"
              step="0.01"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              value={newTransaction.date}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Description</label>
            <input
              type="text"
              value={newTransaction.description}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Transaction description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={newTransaction.category}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tag</label>
            <select
              value={newTransaction.tags}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select tag</option>
              {tags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Bank</label>
            <input
              type="text"
              value={newTransaction.bank}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, bank: e.target.value }))}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Bank name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Card Type</label>
            <select
              value={newTransaction.card_type}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, card_type: e.target.value }))}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="Debit">Debit</option>
              <option value="Credit">Credit</option>
              <option value="Dj-vd">Dj-vd</option>
            </select>
          </div>
          <div className="md:col-span-2 flex gap-4">
            <button
              onClick={onAddTransaction}
              className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-200"
            >
              Add Transaction
            </button>
            <button
              onClick={() => setShowAddTransaction(false)}
              className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddTransactionForm;