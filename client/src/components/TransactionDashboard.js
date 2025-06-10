import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp, Settings, Calendar, DollarSign, Hash, Tag, Filter, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

// Mock transaction data - replace with your actual data later
const generateMockData = () => {
  const categories = ['Dining Out', 'Groceries', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Gas'];
  const tags = ['essential', 'luxury', 'recurring', 'emergency', 'planned', 'impulse'];
  const descriptions = [
    'Achat / DEPANNEUR HARRY', 'Grocery Store Purchase', 'Gas Station Fill-up', 
    'Restaurant Dinner', 'Online Shopping', 'Pharmacy Visit', 'Coffee Shop',
    'Supermarket Weekly', 'Movie Theater', 'Clothing Store', 'Utility Bill'
  ];
  const cardTypes = ['Dj-vd', 'Credit', 'Debit'];
  const banks = ['Dj-vd', 'TD Bank', 'RBC', 'BMO'];

  const data = [];
  for (let i = 1; i <= 500; i++) {
    const date = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    data.push({
      id: 3700 + i,
      amount: parseFloat((Math.random() * 200 + 5).toFixed(2)),
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      card_type: cardTypes[Math.floor(Math.random() * cardTypes.length)],
      date: date.toISOString().split('T')[0],
      time: null,
      bank: banks[Math.floor(Math.random() * banks.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      tags: Math.random() > 0.3 ? tags[Math.floor(Math.random() * tags.length)] : ""
    });
  }
  return data.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const TransactionDashboard = () => {
  const [transactions, setTransactions] = useState(generateMockData());
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('display');
  const [expandedCharts, setExpandedCharts] = useState({ bar: true, pie: true });
  const [chartType, setChartType] = useState('bar');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Settings state
  const [categories, setCategories] = useState(['Dining Out', 'Groceries', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Gas']);
  const [tags, setTags] = useState(['essential', 'luxury', 'recurring', 'emergency', 'planned', 'impulse']);
  const [tagCategoryMappings, setTagCategoryMappings] = useState({});
  const [keywordTagMappings, setKeywordTagMappings] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  
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
    tags: []
  });

  // Get unique values for filter options
  const uniqueCategories = [...new Set(transactions.map(t => t.category))];
  const uniqueTags = [...new Set(transactions.map(t => t.tags).filter(t => t))];

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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

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

  // Settings handlers
  const handleAddItem = (type) => {
    if (!newItemName.trim()) return;
    
    if (type === 'category') {
      setCategories(prev => [...prev, newItemName.trim()]);
    } else if (type === 'tag') {
      setTags(prev => [...prev, newItemName.trim()]);
    }
    setNewItemName('');
  };

  const handleEditItem = (type, oldName, newName) => {
    if (type === 'category') {
      setCategories(prev => prev.map(cat => cat === oldName ? newName : cat));
      // Update transactions
      setTransactions(prev => prev.map(t => 
        t.category === oldName ? { ...t, category: newName } : t
      ));
    } else if (type === 'tag') {
      setTags(prev => prev.map(tag => tag === oldName ? newName : tag));
      // Update transactions
      setTransactions(prev => prev.map(t => 
        t.tags === oldName ? { ...t, tags: newName } : t
      ));
    }
    setEditingItem(null);
  };

  const handleDeleteItem = (type, name) => {
    if (type === 'category') {
      setCategories(prev => prev.filter(cat => cat !== name));
    } else if (type === 'tag') {
      setTags(prev => prev.filter(tag => tag !== name));
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-xl shadow-lg">
          <p className="font-semibold">{`Date: ${label}`}</p>
          <p className="text-blue-600">{`Amount: $${payload[0].value.toFixed(2)}`}</p>
          <p className="text-gray-600">{`Transactions: ${payload[0].payload.count}`}</p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-xl shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-blue-600">{`Amount: $${payload[0].value.toFixed(2)}`}</p>
          <p className="text-gray-600">{`Transactions: ${payload[0].payload.count}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Settings */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Transaction Analytics</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-6 py-3 bg-white border rounded-2xl hover:bg-gray-50 shadow-lg transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white rounded-3xl shadow-xl border mb-8 overflow-hidden">
            <div className="border-b bg-gray-50 p-6">
              <div className="flex gap-4">
                {['display', 'categories', 'tags', 'mappings', 'transactions'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveSettingsTab(tab)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeSettingsTab === tab
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-6">
              {/* Display Settings */}
              {activeSettingsTab === 'display' && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-lg">Display Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Items per page</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                        className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Chart Type</label>
                      <select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value)}
                        className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="bar">Bar Chart</option>
                        <option value="line">Line Chart</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Categories Management */}
              {activeSettingsTab === 'categories' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Manage Categories</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="New category name"
                        className="border rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleAddItem('category')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        {editingItem === `category-${category}` ? (
                          <div className="flex gap-2 w-full">
                            <input
                              type="text"
                              defaultValue={category}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditItem('category', category, e.target.value);
                                }
                              }}
                              className="flex-1 border rounded-lg px-2 py-1 text-sm"
                              autoFocus
                            />
                            <button
                              onClick={(e) => {
                                const input = e.target.parentElement.querySelector('input');
                                handleEditItem('category', category, input.value);
                              }}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-medium">{category}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingItem(`category-${category}`)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem('category', category)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags Management */}
              {activeSettingsTab === 'tags' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Manage Tags</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="New tag name"
                        className="border rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleAddItem('tag')}
                        className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors duration-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {tags.map((tag) => (
                      <div key={tag} className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                        {editingItem === `tag-${tag}` ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              defaultValue={tag}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditItem('tag', tag, e.target.value);
                                }
                              }}
                              className="border rounded-lg px-2 py-1 text-sm"
                              autoFocus
                            />
                            <button
                              onClick={(e) => {
                                const input = e.target.parentElement.querySelector('input');
                                handleEditItem('tag', tag, input.value);
                              }}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Tag className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-800">{tag}</span>
                            <button
                              onClick={() => setEditingItem(`tag-${tag}`)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem('tag', tag)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mappings */}
              {activeSettingsTab === 'mappings' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Tag-Category Mappings</h3>
                    <p className="text-gray-600 mb-4">Associate tags with categories for automatic tagging</p>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600">Feature coming soon - Auto-assign tags based on categories</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Keyword-Tag Mappings</h3>
                    <p className="text-gray-600 mb-4">Auto-assign tags based on keywords in descriptions</p>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600">Feature coming soon - Auto-assign tags based on keywords</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Transaction */}
              {activeSettingsTab === 'transactions' && (
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
                          onClick={handleAddTransaction}
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
              )}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-8 rounded-3xl shadow-xl border">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-100 rounded-2xl">
                <Hash className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Transactions</p>
                <p className="text-3xl font-bold text-gray-900">{quickStats.count.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-xl border">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-green-100 rounded-2xl">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Amount</p>
                <p className="text-3xl font-bold text-gray-900">${quickStats.total.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-xl border">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-purple-100 rounded-2xl">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium">Average Amount</p>
                <p className="text-3xl font-bold text-gray-900">${quickStats.average.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
  <div className="bg-white p-8 rounded-3xl shadow-xl border mb-8">
  {/* Header with toggle */}
  <div className="flex justify-between items-center mb-6">
    <h3 className="font-semibold text-xl flex items-center gap-3">
      <Filter className="w-6 h-6" />
      Filters
    </h3>
    <button
      onClick={() => setExpandedCharts(prev => ({ ...prev, filters: !prev.filters }))}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
    >
      {expandedCharts.filters ? (
        <ChevronUp className="w-5 h-5" />
      ) : (
        <ChevronDown className="w-5 h-5" />
      )}
    </button>
  </div>

  {/* Expandable content */}
  {expandedCharts.filters && (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Date From</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Date To</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Min Amount</label>
          <input
            type="number"
            step="0.01"
            value={filters.amountMin}
            onChange={(e) => handleFilterChange('amountMin', e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Max Amount</label>
          <input
            type="number"
            step="0.01"
            value={filters.amountMax}
            onChange={(e) => handleFilterChange('amountMax', e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="999.99"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Keyword</label>
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search description..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Categories</label>
          <div className="max-h-32 overflow-y-auto border rounded-xl p-3 bg-gray-50">
            {uniqueCategories.map((category) => (
              <label key={category} className="flex items-center gap-2 text-sm mb-2">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category)}
                  onChange={() => handleMultiSelectFilter('categories', category)}
                  className="rounded"
                />
                {category}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium mb-3">Tags</label>
        <div className="flex flex-wrap gap-3">
          {uniqueTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleMultiSelectFilter('tags', tag)}
              className={`px-4 py-2 rounded-full text-sm border transition-all duration-200 ${
                filters.tags.includes(tag)
                  ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </>
  )}
</div>

        {/* Charts */}
        <div className="space-y-8 mb-8">
          {/* Bar/Line Chart */}
          <div className="bg-white p-8 rounded-3xl shadow-xl border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-xl">Transactions Over Time</h3>
              <button
                onClick={() => setExpandedCharts(prev => ({ ...prev, bar: !prev.bar }))}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                {expandedCharts.bar ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
            {expandedCharts.bar && (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Pie Chart */}
          <div className="bg-white p-8 rounded-3xl shadow-xl border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-xl">Categories Distribution</h3>
              <button
                onClick={() => setExpandedCharts(prev => ({ ...prev, pie: !prev.pie }))}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                {expandedCharts.pie ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
            {expandedCharts.pie && (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
          <div className="p-8 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-xl">Transactions ({filteredTransactions.length})</h3>
              <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-xl border">
                Page {currentPage} of {Math.ceil(filteredTransactions.length / itemsPerPage)}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('date')} className="flex items-center gap-1 hover:text-gray-700 transition-colors duration-200">
                      Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('description')} className="flex items-center gap-1 hover:text-gray-700 transition-colors duration-200">
                      Description {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('amount')} className="flex items-center gap-1 hover:text-gray-700 transition-colors duration-200">
                      Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('category')} className="flex items-center gap-1 hover:text-gray-700 transition-colors duration-200">
                      Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                  <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
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
                        onClick={() => handleMultiSelectFilter('categories', transaction.category)}
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
                          onClick={() => handleMultiSelectFilter('tags', transaction.tags)}
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
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors duration-200"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(Math.ceil(filteredTransactions.length / itemsPerPage), currentPage + 1))}
                disabled={currentPage >= Math.ceil(filteredTransactions.length / itemsPerPage)}
                className="px-4 py-2 border rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors duration-200"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDashboard;