import React, { useState, useEffect } from 'react';
import { smartCategorizationService } from '../../Services/smartCategorizationService';

const SmartCategorizationSettings = () => {
  const [stats, setStats] = useState({});
  const [keywordRules, setKeywordRules] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [mlStats, setMLStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // New keyword rule form
  const [newRule, setNewRule] = useState({
    keyword: '',
    category: '',
    tags: '',
    priority: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, rulesData, suggestionsData, mlData] = await Promise.all([
        smartCategorizationService.getStats(),
        smartCategorizationService.getKeywordRules(),
        smartCategorizationService.getKeywordSuggestions(),
        smartCategorizationService.getMLModelStats()
      ]);
      
      setStats(statsData.data);
      setKeywordRules(rulesData.data);
      setSuggestions(suggestionsData.data);
      setMLStats(mlData.data);
    } catch (error) {
      console.error('Error loading smart categorization data:', error);
    }
  };

  const runSmartCategorization = async () => {
    setLoading(true);
    try {
      const result = await smartCategorizationService.runSmartCategorization();
      alert(`✅ Categorization complete! Updated ${result.data.updated} transactions`);
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
      const tags = newRule.tags.split(',').map(t => t.trim()).filter(t => t);
      await smartCategorizationService.addKeywordRule({
        ...newRule,
        tags
      });
      
      setNewRule({ keyword: '', category: '', tags: '', priority: 1 });
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

  const trainMLModel = async () => {
    setLoading(true);
    try {
      const result = await smartCategorizationService.trainMLModel();
      alert(`🤖 ML Model trained! Accuracy: ${(result.data.accuracy * 100).toFixed(1)}%`);
      await loadData();
    } catch (error) {
      console.error('Error training ML model:', error);
      alert('❌ Failed to train ML model');
    } finally {
      setLoading(false);
    }
  };

  const runMLPredictions = async () => {
    setLoading(true);
    try {
      const result = await smartCategorizationService.runMLPredictions();
      alert(`🤖 ML predictions complete! Updated ${result.data.updated} transactions`);
      await loadData();
    } catch (error) {
      console.error('Error running ML predictions:', error);
      alert('❌ Failed to run ML predictions');
    } finally {
      setLoading(false);
    }
  };

  const addSuggestedKeyword = async (suggestion) => {
    setNewRule({
      keyword: suggestion.keyword,
      category: suggestion.suggested_category,
      tags: '',
      priority: 2
    });
    setActiveTab('rules');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        🧠 Smart Categorization
      </h3>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 border-b">
        {[
          { id: 'overview', label: '📊 Overview', icon: '📊' },
          { id: 'rules', label: '🔧 Keyword Rules', icon: '🔧' },
          { id: 'suggestions', label: '💡 Suggestions', icon: '💡' },
          { id: 'ml', label: '🤖 Machine Learning', icon: '🤖' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700">Uncategorized</h4>
              <p className="text-2xl font-bold text-red-600">{stats.uncategorized || 0}</p>
              <p className="text-sm text-gray-500">transactions need categorization</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700">Keyword Rules</h4>
              <p className="text-2xl font-bold text-blue-600">{keywordRules.length}</p>
              <p className="text-sm text-gray-500">active rules</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700">ML Model</h4>
              <p className="text-2xl font-bold text-green-600">
                {mlStats.status === 'trained' ? '✅' : '❌'}
              </p>
              <p className="text-sm text-gray-500">
                {mlStats.status === 'trained' 
                  ? `${(mlStats.accuracy * 100).toFixed(1)}% accuracy` 
                  : 'not trained'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={runSmartCategorization}
              disabled={loading}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-semibold"
            >
              {loading ? '🔄 Processing...' : '🚀 Run Smart Categorization'}
            </button>
            
            <p className="text-sm text-gray-600 text-center">
              This will apply keyword rules and ML predictions to uncategorized transactions
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <input
                type="text"
                placeholder="Keyword (e.g., 'amazon')"
                value={newRule.keyword}
                onChange={(e) => setNewRule({...newRule, keyword: e.target.value})}
                className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Category"
                value={newRule.category}
                onChange={(e) => setNewRule({...newRule, category: e.target.value})}
                className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Tags (comma-separated)"
                value={newRule.tags}
                onChange={(e) => setNewRule({...newRule, tags: e.target.value})}
                className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newRule.priority}
                onChange={(e) => setNewRule({...newRule, priority: parseInt(e.target.value)})}
                className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Priority: Low</option>
                <option value={2}>Priority: Medium</option>
                <option value={3}>Priority: High</option>
              </select>
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 font-medium"
              >
                Add Rule
              </button>
            </div>
          </form>

          {/* Existing Rules */}
          <div>
            <h4 className="font-semibold mb-3">Active Keyword Rules ({keywordRules.length})</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {keywordRules.map((rule, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                  <div className="flex-1">
                    <span className="font-medium text-blue-600">"{rule.keyword}"</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{rule.category}</span>
                    {rule.tags && rule.tags.length > 0 && (
                      <span className="ml-2 text-sm text-gray-600">
                        [{rule.tags.join(', ')}]
                      </span>
                    )}
                    <span className={`ml-2 px-2 py-1 text-xs rounded ${
                      rule.priority === 3 ? 'bg-red-100 text-red-700' :
                      rule.priority === 2 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      Priority {rule.priority}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteKeywordRule(rule.keyword)}
                    className="text-red-500 hover:text-red-700 ml-4"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          <h4 className="font-semibold">💡 Keyword Suggestions from Uncategorized Transactions</h4>
          <p className="text-gray-600">
            These keywords appear frequently in uncategorized transactions. Click to create a rule.
          </p>
          
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
        </div>
      )}

      {/* Machine Learning Tab */}
      {activeTab === 'ml' && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🤖 ML Model Status</h4>
            {mlStats.status === 'trained' ? (
              <div className="text-green-700">
                <p>✅ Model is trained and ready</p>
                <p>Accuracy: {(mlStats.accuracy * 100).toFixed(1)}%</p>
                <p>Training data: {mlStats.training_samples} transactions</p>
                <p>Categories: {mlStats.total_categories}</p>
              </div>
            ) : (
              <div className="text-red-700">
                <p>❌ Model is not trained</p>
                <p>You need at least 10 categorized transactions to train the model</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={trainMLModel}
              disabled={loading}
              className="w-full bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 disabled:opacity-50 font-semibold"
            >
              {loading ? '🔄 Training...' : '🧠 Train ML Model'}
            </button>
            
            {mlStats.status === 'trained' && (
              <button
                onClick={runMLPredictions}
                disabled={loading}
                className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 font-semibold"
              >
                {loading ? '🔄 Predicting...' : '🎯 Run ML Predictions'}
              </button>
            )}
          </div>

          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
            <p><strong>How it works:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>The ML model learns from your existing categorized transactions</li>
              <li>It analyzes merchant names, amounts, and patterns</li>
              <li>Higher confidence predictions are applied automatically</li>
              <li>Retrain periodically as you add more categorized data</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartCategorizationSettings;