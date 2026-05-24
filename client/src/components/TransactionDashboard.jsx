import React, { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useExpandableState } from '../hooks/useExpandableState';
import generateMockData from './utils/mockData';
import FiltersSection from './Sections/FiltersSection';
import SettingsSection from './Sections/SettingsSection';
import TimeChartSection from './Sections/TimeChartSection';
import CategoryChartSection from './Sections/CategoryChartSection';
import TransactionTable from './Sections/TransactionTable';
import QuickStatsSection from './Sections/QuickStatsSection';
import { categoryService } from '../Services/categoryService';
import { tagService } from '../Services/tagService';
import TagEditModal from './common/TagEditModal';
import { useCategories } from '../hooks/useCategories';
import { useTags } from '../hooks/useTags';
import { transactionService } from '../Services/transactionService';


const TransactionDashboard = ({ demoMode: demoModeProp = false }) => {

  // When the parent already forces demo mode (e.g. logged-out landing page),
  // skip the real data hooks' network calls so we don't hit protected /api
  // endpoints from unauthenticated visitors. Hooks are still called every
  // render to honor the Rules of Hooks; the `enabled` flag short-circuits them.
  const realTx = useTransactions({ enabled: !demoModeProp });
  const realCats = useCategories({ enabled: !demoModeProp });
  const realTagsHook = useTags({ enabled: !demoModeProp });

  // Auto-enable the sample-data preview when an authenticated user has no real
  // transactions yet, so the dashboard isn't empty out of the box.
  const autoDemo = !demoModeProp && !realTx.loading && (realTx.transactions?.length === 0);
  const demoMode = demoModeProp || autoDemo;

  const initialMockTransactions = useMemo(
    () =>
      generateMockData().map(t => ({
        ...t,
        tags: typeof t.tags === 'string' && t.tags.length > 0
          ? t.tags.split(',').map(s => s.trim()).filter(Boolean)
          : Array.isArray(t.tags) ? t.tags : []
      })),
    []
  );

  const loading = demoMode ? false : realTx.loading;
  const error = demoMode ? null : realTx.error;

  const realTransactions = realTx.transactions;
  const realCategories = realCats.categories;
  const refreshCategories = realCats.refreshCategories;
  const realTags = realTagsHook.tags;
  const refreshTags = realTagsHook.refreshTags;

  const addTag = demoMode ? async () => {} : realTx.addTag;
  const removeTag = demoMode ? async () => {} : realTx.removeTag;

  const [transactions, setTransactions] = useState(
    demoMode ? initialMockTransactions : []
  );

  React.useEffect(() => {
    if (demoMode) {
      setTransactions(initialMockTransactions);
      return;
    }
    const parsed = realTransactions.map(t => ({
      ...t,
      tags: typeof t.tags === 'string' && t.tags.length > 0
        ? t.tags.split(',').map(s => s.trim()).filter(Boolean)
        : Array.isArray(t.tags) ? t.tags : []
    }));
    setTransactions(parsed);
  }, [demoMode, realTransactions, initialMockTransactions]);

  const { expandedSections, toggleSection } = useExpandableState({
    settings: false,
    filters: true,
    timeChart: true,
    categoryChart: true
  });

  const [activeSettingsTab, setActiveSettingsTab] = useState('display');
  const [chartType, setChartType] = useState('bar');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [timeGrouping, setTimeGrouping] = useState('daily');
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState('none');

  const [localCategories, setLocalCategories] = useState([]);
  const [localTags, setLocalTags] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [newItemName, setNewItemName] = useState('');

  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editValues, setEditValues] = useState({});

  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    description: '',
    card_type: 'Debit',
    date: new Date().toISOString().split('T')[0],
    bank: '',
    category: '',
    tags: ''
  });

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    keyword: '',
    categories: [],
    tags: [],
    banks: []
  });

  React.useEffect(() => {
    if (demoMode) {
      const cats = [...new Set(initialMockTransactions.map(t => t.category).filter(Boolean))];
      const tgs = [...new Set(initialMockTransactions.flatMap(t => t.tags || []).filter(Boolean))];
      setLocalCategories(cats);
      setLocalTags(tgs);
    } else {
      setLocalCategories(Array.isArray(realCategories) ? realCategories : []);
    }
  }, [demoMode, realCategories, initialMockTransactions]);

  React.useEffect(() => {
    if (!demoMode) {
      setLocalTags(Array.isArray(realTags) ? realTags : []);
    }
  }, [demoMode, realTags]);

  const uniqueCategories = [...new Set(transactions.map(t => t.category).filter(Boolean))];
  const uniqueTags = [...new Set(transactions.flatMap(t => (Array.isArray(t.tags) ? t.tags : [])).filter(Boolean))];
  const uniqueCardTypes = [...new Set(transactions.map(t => t.bank).filter(t => t))];

  const [showTagModal, setShowTagModal] = useState(false);
  const [editingTagsForTransaction, setEditingTagsForTransaction] = useState(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      if (filters.dateFrom && transaction.date < filters.dateFrom) return false;
      if (filters.dateTo && transaction.date > filters.dateTo) return false;
      if (filters.amountMin && transaction.amount < parseFloat(filters.amountMin)) return false;
      if (filters.amountMax && transaction.amount > parseFloat(filters.amountMax)) return false;
      if (filters.keyword && !(transaction.description || '').toLowerCase().includes(filters.keyword.toLowerCase())) return false;
      if (filters.categories.length > 0 && !filters.categories.includes(transaction.category)) return false;
      if (filters.tags.length > 0 && !filters.tags.some((tag) => transaction.tags?.includes(tag))) return false;
      if (filters.banks.length > 0 && !filters.banks.includes(transaction.bank)) return false;
      return true;
    });
  }, [transactions, filters]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'amount') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      } else if (sortField === 'date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [filteredTransactions, sortField, sortDirection]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedTransactions, currentPage, itemsPerPage]);

  const quickStats = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.transaction_type !== 'income');
    const income = filteredTransactions.filter(t => t.transaction_type === 'income');
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const avgAmount = expenses.length > 0 ? totalExpenses / expenses.length : 0;
    return {
      count: filteredTransactions.length,
      expenseCount: expenses.length,
      incomeCount: income.length,
      total: totalExpenses,
      totalIncome: totalIncome,
      average: avgAmount
    };
  }, [filteredTransactions]);

  const chartData = useMemo(() => {
    const getTimeKey = (date, grouping) => {
      const [year, month, day] = date.split('-').map(Number);
      const d = new Date(year, month - 1, day);

      switch(grouping) {
        case 'weekly':
          const startOfWeek = new Date(d);
          startOfWeek.setDate(d.getDate() - d.getDay() + 1);
          return `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
        case 'monthly':
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        case 'yearly':
          return `${d.getFullYear()}-01-01`;
        default:
          return date;
      }
    };

    const expenseTransactions = filteredTransactions.filter(t => t.transaction_type !== 'income');
    const dateGroups = expenseTransactions.reduce((acc, transaction) => {
      const timeKey = getTimeKey(transaction.date, timeGrouping);

      if (!acc[timeKey]) {
        acc[timeKey] = {
          date: timeKey,
          amount: 0,
          count: 0,
          categories: {}
        };
      }

      acc[timeKey].amount += transaction.amount;
      acc[timeKey].count += 1;

      if (showCategoryBreakdown !== 'none') {
        const category = transaction.category || 'Uncategorized';
        if (!acc[timeKey].categories[category]) {
          acc[timeKey].categories[category] = 0;
        }
        acc[timeKey].categories[category] += transaction.amount;
      }

      return acc;
    }, {});

    return Object.values(dateGroups).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredTransactions, timeGrouping, showCategoryBreakdown]);

  const pieChartData = useMemo(() => {
    const expensesOnly = filteredTransactions.filter(t => t.transaction_type !== 'income');
    const categoryGroups = expensesOnly.reduce((acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = { name: category, value: 0, count: 0 };
      }
      acc[category].value += transaction.amount;
      acc[category].count += 1;
      return acc;
    }, {});

    return Object.values(categoryGroups);
  }, [filteredTransactions]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleOpenTagModal = (transaction) => {
    setEditingTagsForTransaction(transaction);
    setShowTagModal(true);
  };

  const handleCloseTagModal = () => {
    setShowTagModal(false);
    setEditingTagsForTransaction(null);
  };

  const handleSaveTagChanges = async (updatedTags) => {
    if (demoMode && editingTagsForTransaction) {
      setTransactions(prev => prev.map(t =>
        t.id === editingTagsForTransaction.id ? { ...t, tags: updatedTags } : t
      ));
    }
    setShowTagModal(false);
    setEditingTagsForTransaction(null);
  };

  const handleStartEdit = (transaction, field) => {
    setEditingTransaction(`${transaction.id}-${field}`);
    setEditValues({
      [field]: field === 'tags'
        ? (Array.isArray(transaction.tags) ? transaction.tags : [])
        : transaction[field]
    });
  };

  const handleSaveEdit = async (transaction, field) => {
    const newValue = editValues[field];

    if (field === 'tags') {
      setEditingTagsForTransaction(transaction);
      setShowTagModal(true);
      setEditingTransaction(null);
      setEditValues({});
      return;
    }

    if (demoMode) {
      setTransactions(prev => prev.map(t => {
        if (t.id !== transaction.id) return t;
        if (field === 'amount') return { ...t, amount: parseFloat(newValue) };
        return { ...t, [field]: newValue };
      }));
      setEditingTransaction(null);
      setEditValues({});
      return;
    }

    try {
      if (field === 'category') {
        await realTx.updateCategory(transaction.id, newValue);
      } else if (field === 'amount') {
        await realTx.updateAmount(transaction.id, parseFloat(newValue));
      } else if (field === 'description') {
        await realTx.updateDescription(transaction.id, newValue);
      }
      setEditingTransaction(null);
      setEditValues({});
    } catch (err) {
      alert('Failed to update transaction. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setEditValues({});
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleMultiSelectFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
    setCurrentPage(1);
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (demoMode) {
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      return;
    }
    try {
      await realTx.deleteTransaction(transactionId);
      alert('Transaction deleted successfully!');
    } catch (err) {
      alert('Failed to delete transaction. Please try again.');
    }
  };

  const handleAddItem = (type) => {
    if (!newItemName.trim()) return;

    if (type === 'category') {
      setLocalCategories(prev => [...prev, newItemName.trim()]);
    } else if (type === 'tag') {
      setLocalTags(prev => [...prev, newItemName.trim()]);
    }
    setNewItemName('');
  };

  const handleEditItem = (type, oldName, newName) => {
    if (type === 'category') {
      setLocalCategories(prev => prev.map(cat => cat === oldName ? newName : cat));
      setTransactions(prev => prev.map(t =>
        t.category === oldName ? { ...t, category: newName } : t
      ));
    } else if (type === 'tag') {
      setLocalTags(prev => prev.map(tag => tag === oldName ? newName : tag));
      setTransactions(prev => prev.map(t => ({
        ...t,
        tags: Array.isArray(t.tags) ? t.tags.map(tag => (tag === oldName ? newName : tag)) : []
      })));
    }
    setEditingItem(null);
  };

  const handleDeleteItem = (type, name) => {
    if (type === 'category') {
      setLocalCategories(prev => prev.filter(cat => cat !== name));
    } else if (type === 'tag') {
      setLocalTags(prev => prev.filter(tag => tag !== name));
    }
  };

  const handleAddTransaction = async () => {
    if (demoMode) {
      const newId = Math.max(0, ...transactions.map(t => t.id || 0)) + 1;
      const created = {
        ...newTransaction,
        id: newId,
        amount: parseFloat(newTransaction.amount) || 0,
        tags: typeof newTransaction.tags === 'string' && newTransaction.tags.length > 0
          ? newTransaction.tags.split(',').map(s => s.trim()).filter(Boolean)
          : []
      };
      setTransactions(prev => [created, ...prev]);
      setNewTransaction({
        amount: '',
        description: '',
        card_type: 'Debit',
        date: new Date().toISOString().split('T')[0],
        bank: '',
        category: '',
        tags: ''
      });
      setShowAddTransaction(false);
      return;
    }
    try {
      const result = await transactionService.create(newTransaction);
      if (result.applied_rules && result.applied_rules.length > 0) {
        const msg = result.applied_rules
          .map(r => `${r.keyword} → ${r.category || ''}${Array.isArray(r.tags) && r.tags.length ? ' [' + r.tags.join(', ') + ']' : ''}`)
          .join('\n');
        alert(`Applied rules:\n${msg}`);
      }
      setTransactions(prev => [result, ...prev]);
      setNewTransaction({
        amount: '',
        description: '',
        card_type: 'Debit',
        date: new Date().toISOString().split('T')[0],
        bank: '',
        category: '',
        tags: ''
      });
      setShowAddTransaction(false);
    } catch (err) {
      alert('Failed to add transaction');
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    if (demoMode) {
      setLocalCategories(prev => prev.filter(c => c !== categoryName));
      return { success: true };
    }
    try {
      return await categoryService.delete(categoryName);
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteTag = async (tagName) => {
    if (demoMode) {
      setLocalTags(prev => prev.filter(t => t !== tagName));
      return { success: true };
    }
    try {
      return await tagService.delete(tagName);
    } catch (err) {
      throw err;
    }
  };

  const handleCreateTag = async (tagName) => {
    if (demoMode) {
      setLocalTags(prev => prev.includes(tagName) ? prev : [...prev, tagName]);
      return { success: true };
    }
    try {
      return await tagService.create(tagName);
    } catch (err) {
      throw err;
    }
  };

  return (
    <>
        {demoMode && !demoModeProp && (
          <div className="mb-4 px-4 py-2 bg-blue-900/20 text-blue-300 rounded-lg border border-blue-800/60 text-sm">
            You haven't added any transactions yet — showing sample data so you can explore.
            Head to <strong>PDF Import</strong> to load your first statement.
          </div>
        )}

        {loading && (
          <div className="mb-4 text-center text-sm text-gray-400">Loading transactions...</div>
        )}

        {error && (
          <div className="mb-4 px-4 py-2 bg-red-900/30 text-red-400 rounded-lg border border-red-800 text-sm">
            {error}
          </div>
        )}

        <QuickStatsSection quickStats={quickStats} />

        <SettingsSection
          isExpanded={expandedSections.settings}
          onToggle={() => toggleSection('settings')}
          activeTab={activeSettingsTab}
          setActiveTab={setActiveSettingsTab}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          chartType={chartType}
          setChartType={setChartType}
          categories={localCategories}
          setCategories={setLocalCategories}
          tags={localTags}
          setTags={setLocalTags}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          newItemName={newItemName}
          setNewItemName={setNewItemName}
          showAddTransaction={showAddTransaction}
          setShowAddTransaction={setShowAddTransaction}
          newTransaction={newTransaction}
          setNewTransaction={setNewTransaction}
          onAddItem={handleAddItem}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
          onAddTransaction={handleAddTransaction}
          onDeleteCategory={handleDeleteCategory}
          onDeleteTag={handleDeleteTag}
          onRefreshTags={refreshTags}
          onRefreshCategories={refreshCategories}
          onCreateTag={handleCreateTag}
          timeGrouping={timeGrouping}
          setTimeGrouping={setTimeGrouping}
          showCategoryBreakdown={showCategoryBreakdown}
          setShowCategoryBreakdown={setShowCategoryBreakdown}
        />

        <FiltersSection
          isExpanded={expandedSections.filters}
          onToggle={() => toggleSection('filters')}
          filters={filters}
          onFilterChange={handleFilterChange}
          onMultiSelectFilter={handleMultiSelectFilter}
          uniqueCategories={uniqueCategories}
          uniqueTags={uniqueTags}
          uniqueCardTypes={uniqueCardTypes}
          transactions={transactions}
        />

        <TimeChartSection
          isExpanded={expandedSections.timeChart}
          onToggle={() => toggleSection('timeChart')}
          chartData={chartData}
          chartType={chartType}
          timeGrouping={timeGrouping}
          showCategoryBreakdown={showCategoryBreakdown}
        />

        <CategoryChartSection
          isExpanded={expandedSections.categoryChart}
          onToggle={() => toggleSection('categoryChart')}
          pieChartData={pieChartData}
        />

        <TransactionTable
          transactions={transactions}
          filteredTransactions={filteredTransactions}
          paginatedTransactions={paginatedTransactions}
          sortField={sortField}
          sortDirection={sortDirection}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          filters={filters}
          onSort={handleSort}
          onMultiSelectFilter={handleMultiSelectFilter}
          onPageChange={setCurrentPage}
          editingTransaction={editingTransaction}
          editValues={editValues}
          setEditValues={setEditValues}
          onStartEdit={handleStartEdit}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          categories={localCategories}
          uniqueTags={localTags}
          onOpenTagModal={handleOpenTagModal}
          removeTag={removeTag}
          onDeleteTransaction={handleDeleteTransaction}
        />

        <TagEditModal
          isOpen={showTagModal}
          onClose={handleCloseTagModal}
          transaction={editingTagsForTransaction}
          allAvailableTags={localTags}
          onSave={handleSaveTagChanges}
          addTag={addTag}
          removeTag={removeTag}
        />

    </>
  );
};

export default TransactionDashboard;
