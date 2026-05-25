import React from 'react';
import { BrandLine, I } from '../../ui/BrandIcon';
import { useTranslation } from 'react-i18next';

const AddTransactionForm = ({
  showAddTransaction,
  setShowAddTransaction,
  newTransaction,
  setNewTransaction,
  categories,
  tags,
  onAddTransaction
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg text-gray-200">{t('addTransaction.title')}</h3>
        <button
          onClick={() => setShowAddTransaction(!showAddTransaction)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <BrandLine name={I.plus} size={16} style={{ color: '#fff' }} />
        </button>
      </div>

      {showAddTransaction && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-gray-800 rounded-lg border border-gray-700">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('addTransaction.amount')}</label>
            <input
              type="number"
              step="0.01"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full border border-gray-600 rounded-md px-4 py-3 bg-gray-700 text-gray-200 focus:ring-1 focus:ring-gray-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('addTransaction.date')}</label>
            <input
              type="date"
              value={newTransaction.date}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
              className="w-full border border-gray-600 rounded-md px-4 py-3 bg-gray-700 text-gray-200 focus:ring-1 focus:ring-gray-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('addTransaction.description')}</label>
            <input
              type="text"
              value={newTransaction.description}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border border-gray-600 rounded-md px-4 py-3 bg-gray-700 text-gray-200 focus:ring-1 focus:ring-gray-500"
              placeholder={t('addTransaction.description')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('addTransaction.category')}</label>
            <select
              value={newTransaction.category}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
              className="w-full border border-gray-600 rounded-md px-4 py-3 bg-gray-700 text-gray-200 focus:ring-1 focus:ring-gray-500"
            >
              <option value="">{t('addTransaction.selectCategory')}</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('addTransaction.tag')}</label>
            <select
              value={newTransaction.tags}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full border border-gray-600 rounded-md px-4 py-3 bg-gray-700 text-gray-200 focus:ring-1 focus:ring-gray-500"
            >
              <option value="">{t('addTransaction.selectTag')}</option>
              {tags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('addTransaction.bank')}</label>
            <input
              type="text"
              value={newTransaction.bank}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, bank: e.target.value }))}
              className="w-full border border-gray-600 rounded-md px-4 py-3 bg-gray-700 text-gray-200 focus:ring-1 focus:ring-gray-500"
              placeholder={t('addTransaction.bank')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('addTransaction.cardType')}</label>
            <select
              value={newTransaction.card_type}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, card_type: e.target.value }))}
              className="w-full border border-gray-600 rounded-md px-4 py-3 bg-gray-700 text-gray-200 focus:ring-1 focus:ring-gray-500"
            >
              <option value="Debit">Debit</option>
              <option value="Credit">Credit</option>
              <option value="Dj-vd">Dj-vd</option>
            </select>
          </div>
          <div className="md:col-span-2 flex gap-4">
            <button
              onClick={onAddTransaction}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              {t('addTransaction.add')}
            </button>
            <button
              onClick={() => setShowAddTransaction(false)}
              className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors duration-200"
            >
              {t('addTransaction.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddTransactionForm;
