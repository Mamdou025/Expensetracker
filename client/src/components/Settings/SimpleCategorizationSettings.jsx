import React, { useState, useEffect } from 'react';
import { smartCategorizationService } from '../../Services/smartCategorizationService';

const SimpleCategorizationSettings = () => {
  const [stats, setStats] = useState({});
  const [keywordRules, setKeywordRules] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // New keyword rule form
  const [newRule, setNewRule] = useState({
    keyword: '',
    category: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, rulesData] = await Promise.all([
        smartCategorizationService.getStats(),
        smartCategorizationService.getKeywordRules(),
      ]);
      
      setStats(statsData.data);
      setKeywordRules(rulesData.data);
      
      // Load suggestions if needed
      if (activeTab === 'suggestions') {
        const suggestionsData = await smartCategorizationService.getKeywordSuggestions();
        setSuggestions(suggestionsData.data);
      }
    } catch (error) {
      console.error('Error loading categorization data:', error);
    }
  };

  const runSmartCategorization = async () => {
    setLoading(true);
    try {
      const result = await smartCategorizationService.runSmartCategorization();
      const updated = result.data.updated || 0;
      alert(`✅ Smart Categorization Complete!\n\n${updated} transactions were automatically categorized using pattern matching.\n\nNo complex ML setup required!`);
      await loadData();
    } catch (error) {
      console.error('Error running smart categorization:', error);
      alert('❌ Failed to run smart categorization');
    } finally {
      setLoading(false);
    }
  };

  const addKeywordRule = async (e) => {
    e.preventDefault();
    try {
      await smartCategorizationService.addKeywordRule({
        keyword: newRule.keyword,
        category: newRule.category,
        tags: [], // Simple version doesn't need tags
        priority: 1
      });
      
      setNewRule({ keyword: '', category: '' });
      await loadData();
      alert('✅ Keyword rule added successfully!');
    } catch (error) {
      console.error('Error adding keyword rule:', error);
      alert('❌ Failed to add keyword rule');
    }
  };

  const deleteKeywordRule = async (keyword) => {
    if (confirm(`Delete keyword rule for "${keyword}"?`)) {
      try {
        await smartCategorizationService.deleteKeywordRule(keyword);
        await loadData();
        alert('✅ Keyword rule deleted!');
      } catch (error) {
        console.error('Error deleting keyword rule:', error);
        alert('❌ Failed to delete keyword rule');
      }
    }
  };

  const addSuggestedKeyword = async (suggestion) => {
    setNewRule({
      keyword: suggestion.keyword,
      category: suggestion.suggested_category,
    });
    setActiveTab('rules');
  };

  const loadSuggestions = async () => {
    try {
      const result = await fetch('/api/smart-categorization/suggestions');
      const data = await result.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestions([]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        🎯 Smart Categorization <span className="text-sm text-green-600 ml-2">(Simple & Reliable)</span>
      </h3>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 border-b">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'rules', label: '🔧 Keyword Rules' },
          { id: 'suggestions', label: '💡 Suggestions' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'suggestions') loadSuggestions();
            }}
            className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-700">Needs Categorization</h4>
              <p className="text-3xl font-bold text-red-600">{stats.uncategorized || 0}</p>
              <p className="text-sm text-red-600">transactions to categorize</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-700">Keyword Rules</h4>
              <p className="text-3xl font-bold text-blue-600">{keywordRules.length}</p>
              <p className="text-sm text-blue-600">custom rules active</p>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-700 mb-2">🎯 How Simple Categorization Works:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• <strong>Pattern Matching:</strong> Recognizes 100+ Canadian merchants (Tim Hortons, Maxi, Shell, etc.)</li>
              <li>• <strong>Keyword Rules:</strong> Create custom rules like "amazon" → "Shopping"</li>
              <li>• <strong>No ML Complexity:</strong> No training, no models, no dependencies - just works!</li>
              <li>• <strong>High Accuracy:</strong> 85-95% confidence on known merchants</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={runSmartCategorization}
              disabled={loading}
              className="w-full bg-blue-500 text-white px-6 py-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-semibold text-lg"
            >
              {loading ? '🔄 Processing...' : '🚀 Run Smart Categorization'}
            </button>
            
            <p className="text-sm text-gray-600 text-center">
              This will automatically categorize transactions using pattern matching and your keyword rules.
              <br />
              <strong>No machine learning setup required!</strong>
            </p>
          </div>
        </div>
      )}

      {/* Keyword Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Add New Rule Form */}
          <form onSubmit={addKeywordRule} className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Add New Keyword Rule</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Keyword (e.g., 'starbucks')"
                value={newRule.keyword}
                onChange={(e) => setNewRule({...newRule, keyword: e.target.value})}
                className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Category (e.g., 'Coffee')"
                value={newRule.category}
                onChange={(e) => setNewRule({...newRule, category: e.target.value})}
                className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 font-medium"
              >
                Add Rule
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Any transaction containing the keyword will be automatically categorized.
            </p>
          </form>

          {/* Existing Rules */}
          <div>
            <h4 className="font-semibold mb-3">Active Keyword Rules ({keywordRules.length})</h4>
            {keywordRules.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <p>No keyword rules yet.</p>
                <p className="text-sm">Add rules above to automatically categorize transactions!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {keywordRules.map((rule, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                    <div className="flex-1">
                      <span className="font-medium text-blue-600">"{rule.keyword}"</span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{rule.category}</span>
                    </div>
                    <button
                      onClick={() => deleteKeywordRule(rule.keyword)}
                      className="text-red-500 hover:text-red-700 ml-4"
                      title="Delete rule"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          <h4 className="font-semibold">💡 Keyword Suggestions</h4>
          <p className="text-gray-600">
            These merchants appear frequently in your uncategorized transactions. Click to create a rule.
          </p>
          
          {suggestions.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              <p>No suggestions available.</p>
              <p className="text-sm">Run smart categorization first to see suggestions for remaining transactions.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                  <div>
                    <span className="font-medium">"{suggestion.keyword}"</span>
                    <span className="ml-2 text-sm text-gray-600">
                      appears {suggestion.frequency} times
                    </span>
                    <span className="ml-2 text-sm text-blue-600">
                      → suggested: {suggestion.suggested_category}
                    </span>
                    <br />
                    <span className="text-xs text-gray-500">Example: {suggestion.example}</span>
                  </div>
                  <button
                    onClick={() => addSuggestedKeyword(suggestion)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    Create Rule
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleCategorizationSettings;