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
import { tagService } from '../Services/tagService';
import TagEditModal from './common/TagEditModal';
// Add these imports with your existing ones:
import { useCategories } from '../hooks/useCategories';
import { useTags } from '../hooks/useTags';
import { keywordMappingService } from '../Services/keywordMappingService';


const TransactionDashboard = () => {


const {
  transactions: realTransactions,
  loading,
  error,
  addTag,
  removeTag,
  updateCategory,
  updateAmount,        
  updateDescription,   
  deleteTransaction
} = useTransactions();

const { 
  categories: realCategories, 
  refreshCategories 
} = useCategories();

const { 
  tags: realTags, 
  refreshTags 
} = useTags();

const [useRealData, setUseRealData] = useState(false);


React.useEffect(() => {
  if (useRealData && realTransactions.length > 0) {
    console.log('🔄 Switching to real data...', realTransactions.length, 'transactions');
    setTransactions(realTransactions);
  } else if (!useRealData) {
    console.log('🔄 Using mock data...');
    setTransactions(generateMockData());
  }
}, [useRealData, realTransactions]);


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


const { expandedSections, toggleSection } = useExpandableState({
    settings: true,
    filters: true,
    timeChart: true,
    categoryChart: true
  });


  const [transactions, setTransactions] = useState(generateMockData());
  const [activeSettingsTab, setActiveSettingsTab] = useState('display');
  const [chartType, setChartType] = useState('bar');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const [timeGrouping, setTimeGrouping] = useState('daily');
const [showCategoryBreakdown, setShowCategoryBreakdown] = useState('none');

console.log('Dashboard state:', { timeGrouping, showCategoryBreakdown });



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


const uniqueCategories = [...new Set(transactions.map(t => t.category))];
  const uniqueTags = [...new Set(transactions.map(t => t.tags).filter(t => t))];
  const uniqueCardTypes = [...new Set(transactions.map(t => t.bank).filter(t => t))]; 

  const [showTagModal, setShowTagModal] = useState(false);
const [editingTagsForTransaction, setEditingTagsForTransaction] = useState(null);



const filteredTransactions = useMemo(() => {
  return transactions.filter(transaction => {
    if (filters.dateFrom && transaction.date < filters.dateFrom) return false;
    if (filters.dateTo && transaction.date > filters.dateTo) return false;
    if (filters.amountMin && transaction.amount < parseFloat(filters.amountMin)) return false;
    if (filters.amountMax && transaction.amount > parseFloat(filters.amountMax)) return false;
    if (filters.keyword && !transaction.description.toLowerCase().includes(filters.keyword.toLowerCase())) return false;
    if (filters.categories.length > 0 && !filters.categories.includes(transaction.category)) return false;
    if (filters.tags.length > 0 && !filters.tags.includes(transaction.tags)) return false;
    if (filters.banks.length > 0 && !filters.banks.includes(transaction.bank)) return false; // ← CHANGE THIS LINE

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


  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedTransactions, currentPage, itemsPerPage]);


  const quickStats = useMemo(() => {
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgAmount = filteredTransactions.length > 0 ? totalAmount / filteredTransactions.length : 0;
    return {
      count: filteredTransactions.length,
      total: totalAmount,
      average: avgAmount
    };
  }, [filteredTransactions]);






const chartData = useMemo(() => {
  
const getTimeKey = (date, grouping) => {

  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(year, month - 1, day); // Month is 0-indexed in JavaScript
  
  switch(grouping) {
    case 'weekly':
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - d.getDay() + 1);
      return `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
    case 'monthly':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    case 'yearly':
      return `${d.getFullYear()}-01-01`;
    default: // daily
      return date;
  }
};

  const dateGroups = filteredTransactions.reduce((acc, transaction) => {
    const timeKey = getTimeKey(transaction.date, timeGrouping);
    
    if (!acc[timeKey]) {
      acc[timeKey] = { 
        date: timeKey, 
        amount: 0, 
        count: 0,
        categories: {} // For category breakdown
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



console.log('🔍 DEBUG - Current filters:', JSON.stringify(filters, null, 2));

console.log('🔍 DEBUG - Filtered transactions sample:');
filteredTransactions.slice(0, 5).forEach((t, i) => {
  console.log(`  ${i + 1}. Date: ${t.date} | Amount: $${t.amount} | Desc: ${t.description}`);
});

console.log('🔍 DEBUG - Chart data generated:');
chartData.slice(0, 10).forEach((item, i) => {
  const parsedDate = new Date(item.date);
  console.log(`  ${i + 1}. Date: ${item.date} | Parsed: ${parsedDate.toLocaleDateString()} | Month: ${parsedDate.getMonth() + 1} | Year: ${parsedDate.getFullYear()} | Amount: $${item.amount}`);
});

console.log(`🔍 DEBUG - Total chart data points: ${chartData.length}`);
console.log(`🔍 DEBUG - Time grouping: ${timeGrouping}`);


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


const handleSaveEdit = async (transaction, field) => {
  try {
    const newValue = editValues[field];
    
    if (field === 'category') {

      if (editValues.isAddingNew && newValue && newValue.trim()) {
        console.log('🆕 Creating new category:', newValue);

      }
      await updateCategory(transaction.id, newValue);
      if (window.confirm('Save this keyword rule?')) {
        try {
          await keywordMappingService.createRule(transaction.description, { category: newValue });
          alert('Keyword rule saved!');
        } catch (ruleError) {
          console.error('Failed to save keyword rule:', ruleError);
          alert('Failed to save keyword rule.');
        }
      }
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


  const handleDeleteTransaction = async (transactionId) => {
  try {
    console.log('🗑️ Deleting transaction:', transactionId);
    await deleteTransaction(transactionId);

    if (!useRealData) {
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
    }

    alert('Transaction deleted successfully!');
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

    if (useRealData) {
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


const handleCreateTag = async (tagName) => {
  try {
    const result = await tagService.create(tagName);
    console.log('Tag created:', result);
    return result;
  } catch (error) {
    console.error('Failed to create tag:', error);
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
      `🟢 Vraies données (${realTransactions.length} transactions)`
    ) : (
      '🔵 données fictives (500 transactions)'
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
  onRefreshTags={refreshTags}  
  onRefreshCategories={refreshCategories}  
  onCreateTag={handleCreateTag}    
    timeGrouping={timeGrouping}
  setTimeGrouping={setTimeGrouping}
  showCategoryBreakdown={showCategoryBreakdown}
  setShowCategoryBreakdown={setShowCategoryBreakdown}       // ← Change this line

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
          timeGrouping={timeGrouping}
          showCategoryBreakdown={showCategoryBreakdown}
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
   uniqueTags={localTags}
  onOpenTagModal={handleOpenTagModal}
  removeTag={removeTag} 
  onDeleteTransaction={handleDeleteTransaction} 
/>
        {/* Tag Edit Modal */}
        <TagEditModal
          isOpen={showTagModal}
          onClose={handleCloseTagModal}
          transaction={editingTagsForTransaction}
          allAvailableTags={localTags}
          onSave={handleSaveTagChanges}
          addTag={addTag}
          removeTag={removeTag}
          
        />


      </div>
    </div>
  );
};

export default TransactionDashboard;