import React, { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useExpandableState } from '../hooks/useExpandableState';
import FiltersSection from './Sections/FiltersSection';
import SettingsSection from './Sections/SettingsSection';
import TimeChartSection from './Sections/TimeChartSection';
import CategoryChartSection from './Sections/CategoryChartSection';
import TransactionTable from './Sections/TransactionTable';
import Header from './ui/Header';
import QuickStatsSection from './Sections/QuickStatsSection';
import generateMockData from './utils/mockData';
// Add these imports with your existing ones:
import { categoryService } from '../Services/categoryService';
import { tagService } from '../Services/tagservice';
import TagEditModal from './common/TagEditModal';
// Add these imports with your existing ones:
import { useCategories } from '../hooks/useCategories';
import { useTags } from '../hooks/useTags';



const TransactionDashboard = () => {


// Find this line and update it to include the new methods:
const { 
  transactions: realTransactions, 
  loading, 
  error,
  addTag,
  removeTag,
  updateCategory,
  updateAmount,        // ← ADD THIS
  updateDescription    // ← ADD THIS
} = useTransactions();

// Add these hooks after your useTransactions hook:
const { 
  categories: realCategories, 
  loading: categoriesLoading,
  refreshCategories 
} = useCategories();

const { 
  tags: realTags, 
  loading: tagsLoading,
  refreshTags 
} = useTags();
// Add this state for toggling between mock and real data
const [useRealData, setUseRealData] = useState(false);

// Update this effect to switch data sources
React.useEffect(() => {
  if (useRealData && realTransactions.length > 0) {
    console.log('🔄 Switching to real data...', realTransactions.length, 'transactions');
    setTransactions(realTransactions);
  } else if (!useRealData) {
    console.log('🔄 Using mock data...');
    setTransactions(generateMockData());
  }
}, [useRealData, realTransactions]);

// Add these useEffect hooks to sync real data:
React.useEffect(() => {
  if (realCategories.length > 0) {
    console.log('📊 Updating categories from API:', realCategories);
    setLocalCategories(realCategories);
  }
}, [realCategories]);

React.useEffect(() => {
  if (realTags.length > 0) {
    console.log('🏷️ Updating tags from API:', realTags);
    setLocalTags(realTags);
  }
}, [realTags]);

  // State management
  const { expandedSections, toggleSection } = useExpandableState({
    settings: false,
    filters: true,
    timeChart: true,
    categoryChart: true
  });

  // Transaction data
  const [transactions, setTransactions] = useState(generateMockData());
  const [activeSettingsTab, setActiveSettingsTab] = useState('display');
  const [chartType, setChartType] = useState('bar');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Settings state
 // ✅ REPLACE WITH - Real data from API:
const [localCategories, setLocalCategories] = useState([]);
const [localTags, setLocalTags] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [newItemName, setNewItemName] = useState('');

  // Add these state variables after your existing useState declarations:
const [editingTransaction, setEditingTransaction] = useState(null);
const [editValues, setEditValues] = useState({});
  
  // Add transaction form
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
  
  // Filters
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    keyword: '',
    categories: [],
    tags: [],
    card_type:[]
  });

  // Get unique values for filter options
  const uniqueCategories = [...new Set(transactions.map(t => t.category))];
  const uniqueTags = [...new Set(transactions.map(t => t.tags).filter(t => t))];
  const uniqueCardTypes = [...new Set(transactions.map(t => t.card_type).filter(t => t))]; 
  // Add this state after your existing editing state:
const [showTagModal, setShowTagModal] = useState(false);
const [editingTagsForTransaction, setEditingTagsForTransaction] = useState(null);


  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      if (filters.dateFrom && transaction.date < filters.dateFrom) return false;
      if (filters.dateTo && transaction.date > filters.dateTo) return false;
      if (filters.amountMin && transaction.amount < parseFloat(filters.amountMin)) return false;
      if (filters.amountMax && transaction.amount > parseFloat(filters.amountMax)) return false;
      if (filters.keyword && !transaction.description.toLowerCase().includes(filters.keyword.toLowerCase())) return false;
      if (filters.categories.length > 0 && !filters.categories.includes(transaction.category)) return false;
      if (filters.tags.length > 0 && !filters.tags.includes(transaction.tags)) return false;
      if (filters.card_type.length > 0 && !filters.card_type.includes(transaction.card_type)) return false; 

      return true;
    });
  }, [transactions, filters]);

  // Sort transactions
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

  // Paginated transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedTransactions, currentPage, itemsPerPage]);

  // Quick stats
  const quickStats = useMemo(() => {
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgAmount = filteredTransactions.length > 0 ? totalAmount / filteredTransactions.length : 0;
    return {
      count: filteredTransactions.length,
      total: totalAmount,
      average: avgAmount
    };
  }, [filteredTransactions]);

  // Chart data
  const chartData = useMemo(() => {
    const dateGroups = filteredTransactions.reduce((acc, transaction) => {
      const date = transaction.date;
      if (!acc[date]) {
        acc[date] = { date, amount: 0, count: 0 };
      }
      acc[date].amount += transaction.amount;
      acc[date].count += 1;
      return acc;
    }, {});
    
    return Object.values(dateGroups).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredTransactions]);

  // Pie chart data
  const pieChartData = useMemo(() => {
    const categoryGroups = filteredTransactions.reduce((acc, transaction) => {
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

  // Handlers
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
  console.log('🔄 Opening tag modal for:', transaction);
  setEditingTagsForTransaction(transaction);
  setShowTagModal(true);
};

const handleCloseTagModal = () => {
  setShowTagModal(false);
  setEditingTagsForTransaction(null);
};

const handleSaveTagChanges = async (updatedTags) => {
  // This will be implemented with the modal component
  console.log('Save tag changes:', updatedTags);
  setShowTagModal(false);
  setEditingTagsForTransaction(null);
};

const handleStartEdit = (transaction, field) => {
  console.log('🔄 handleStartEdit called:', { transaction: transaction.id, field });
  
  setEditingTransaction(`${transaction.id}-${field}`);
  setEditValues({
    [field]: field === 'tags' 
      ? transaction.tags.split(',').map(t => t.trim()).filter(t => t) 
      : transaction[field]
  });
  
  console.log('✅ Editing state set:', {
    editingTransaction: `${transaction.id}-${field}`,
    editValues: { [field]: field === 'tags' ? transaction.tags.split(',').map(t => t.trim()).filter(t => t) : transaction[field] }
  });
};

// Update your handleSaveEdit function to handle new categories:
const handleSaveEdit = async (transaction, field) => {
  try {
    const newValue = editValues[field];
    
    if (field === 'category') {
      // Handle new category creation
      if (editValues.isAddingNew && newValue && newValue.trim()) {
        console.log('🆕 Creating new category:', newValue);
        // Category is created automatically when assigned to transaction
      }
      await updateCategory(transaction.id, newValue);
    } else if (field === 'amount') {
      await updateAmount(transaction.id, parseFloat(newValue));
    } else if (field === 'description') {
      await updateDescription(transaction.id, newValue);
    } else if (field === 'tags') {
      setEditingTagsForTransaction(transaction);
      setShowTagModal(true);
      setEditingTransaction(null);
      setEditValues({});
      return;
    }
    
    setEditingTransaction(null);
    setEditValues({});
  } catch (error) {
    console.error('Failed to update:', error);
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

// Add this handler after your other handlers:
const handleDeleteTransaction = async (transactionId) => {
  try {
    // You'll need to implement this API endpoint
    console.log('🗑️ Deleting transaction:', transactionId);
    // For now, just log - you can implement the actual deletion later
    alert('Delete functionality coming soon!');
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    alert('Failed to delete transaction. Please try again.');
  }
};

const handleAddItem = (type) => {
  if (!newItemName.trim()) return;
  
  if (type === 'category') {
    setLocalCategories(prev => [...prev, newItemName.trim()]); // ← Changed
  } else if (type === 'tag') {
    setLocalTags(prev => [...prev, newItemName.trim()]);       // ← Changed
  }
  setNewItemName('');
};

 // Update handleEditItem function:
const handleEditItem = (type, oldName, newName) => {
  if (type === 'category') {
    setLocalCategories(prev => prev.map(cat => cat === oldName ? newName : cat)); // ← Changed
    setTransactions(prev => prev.map(t => 
      t.category === oldName ? { ...t, category: newName } : t
    ));
  } else if (type === 'tag') {
    setLocalTags(prev => prev.map(tag => tag === oldName ? newName : tag));       // ← Changed
    setTransactions(prev => prev.map(t => 
      t.tags === oldName ? { ...t, tags: newName } : t
    ));
  }
  setEditingItem(null);
};

 const handleDeleteItem = (type, name) => {
  if (type === 'category') {
    setLocalCategories(prev => prev.filter(cat => cat !== name)); // ← Changed
  } else if (type === 'tag') {
    setLocalTags(prev => prev.filter(tag => tag !== name));       // ← Changed
  }
};

  const handleAddTransaction = () => {
    const transaction = {
      id: Math.max(...transactions.map(t => t.id)) + 1,
      amount: parseFloat(newTransaction.amount),
      description: newTransaction.description,
      card_type: newTransaction.card_type,
      date: newTransaction.date,
      time: null,
      bank: newTransaction.bank,
      category: newTransaction.category,
      tags: newTransaction.tags
    };
    
    setTransactions(prev => [transaction, ...prev]);
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
  };

const handleDeleteCategory = async (categoryName) => {
  try {
    const result = await categoryService.delete(categoryName);
    // Refresh transactions to reflect changes
    if (useRealData) {
      // Refresh real data if using real data
      console.log('Category deleted, refreshing transactions...');
    }
    return result;
  } catch (error) {
    throw error;
  }
};


const handleDeleteTag = async (tagName) => {
  try {
    const result = await tagService.delete(tagName);
    console.log('Tag deleted, refreshing...');
    return result;
  } catch (error) {
    throw error;
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        
{/* Header */}
<Header onSettingsToggle={() => toggleSection('settings')} />

{/* Temporary toggle button for testing */}
<div className="mb-6 flex justify-center">
  <button
    onClick={() => setUseRealData(!useRealData)}
    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
      useRealData 
        ? 'bg-green-500 text-white shadow-lg' 
        : 'bg-blue-500 text-white shadow-lg'
    }`}
    disabled={loading}
  >
    {loading ? (
      '⏳ Loading Real Data...'
    ) : useRealData ? (
      `🟢 Real Data (${realTransactions.length} transactions)`
    ) : (
      '🔵 Mock Data (500 transactions)'
    )}
  </button>
  
  {error && (
    <div className="ml-4 px-4 py-2 bg-red-100 text-red-700 rounded-xl">
      ❌ Error: {error}
    </div>
  )}
</div>



        {/* Quick Stats */}
        <QuickStatsSection quickStats={quickStats} />

        {/* Settings Section */}
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
  // ← ADD THESE NEW PROPS:
  onDeleteCategory={handleDeleteCategory}
  onDeleteTag={handleDeleteTag}
/>
        {/* Filters Section */}
        <FiltersSection
          isExpanded={expandedSections.filters}
          onToggle={() => toggleSection('filters')}
          filters={filters}
          onFilterChange={handleFilterChange}
          onMultiSelectFilter={handleMultiSelectFilter}
          uniqueCategories={uniqueCategories}
          uniqueTags={uniqueTags}
          uniqueCardTypes={uniqueCardTypes}  // ← ADD THIS

        />

        {/* Time Chart Section */}
        <TimeChartSection
          isExpanded={expandedSections.timeChart}
          onToggle={() => toggleSection('timeChart')}
          chartData={chartData}
          chartType={chartType}
        />

        {/* Category Chart Section */}
        <CategoryChartSection
          isExpanded={expandedSections.categoryChart}
          onToggle={() => toggleSection('categoryChart')}
          pieChartData={pieChartData}
        />

        {/* Transaction Table */}

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
  uniqueTags={uniqueTags}
  onOpenTagModal={handleOpenTagModal}
  removeTag={removeTag} 
  onDeleteTransaction={handleDeleteTransaction} 
/>
        {/* Tag Edit Modal */}
        <TagEditModal
          isOpen={showTagModal}
          onClose={handleCloseTagModal}
          transaction={editingTagsForTransaction}
          allAvailableTags={uniqueTags}
          onSave={handleSaveTagChanges}
          addTag={addTag}
          removeTag={removeTag}
        />


      </div>
    </div>
  );
};

export default TransactionDashboard;