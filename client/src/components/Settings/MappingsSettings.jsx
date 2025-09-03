// src/components/settings/MappingsSettings.jsx
import React, { useState, useEffect } from 'react';

const defaultRule = { keyword: '', target_type: 'tag', target_value: '' };

const MappingsSettings = () => {
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState(defaultRule);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(defaultRule);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/rules');
      const data = await res.json();
      setRules(data);
    } catch (err) {
      console.error('Failed to load rules', err);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleAddRule = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      });
      setNewRule(defaultRule);
      fetchRules();
    } catch (err) {
      console.error('Failed to add rule', err);
    }
  };

  const startEdit = (rule) => {
    setEditingId(rule.id);
    setEditData({
      keyword: rule.keyword,
      target_type: rule.target_type,
      target_value: rule.target_value,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(defaultRule);
  };

  const saveEdit = async (id) => {
    try {
      await fetch(`/api/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      cancelEdit();
      fetchRules();
    } catch (err) {
      console.error('Failed to update rule', err);
    }
  };

  const deleteRule = async (id) => {
    try {
      await fetch(`/api/rules/${id}`, { method: 'DELETE' });
      fetchRules();
    } catch (err) {
      console.error('Failed to delete rule', err);
    }
  };

  return (
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
        <div className="bg-gray-50 p-4 rounded-xl space-y-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 px-2">Keyword</th>
                <th className="py-2 px-2">Target Type</th>
                <th className="py-2 px-2">Target Value</th>
                <th className="py-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b">
                  {editingId === rule.id ? (
                    <>
                      <td className="py-2 px-2">
                        <input
                          className="border p-1 rounded w-full"
                          value={editData.keyword}
                          onChange={(e) => setEditData({ ...editData, keyword: e.target.value })}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          className="border p-1 rounded w-full"
                          value={editData.target_type}
                          onChange={(e) => setEditData({ ...editData, target_type: e.target.value })}
                        >
                          <option value="tag">tag</option>
                          <option value="category">category</option>
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          className="border p-1 rounded w-full"
                          value={editData.target_value}
                          onChange={(e) => setEditData({ ...editData, target_value: e.target.value })}
                        />
                      </td>
                      <td className="py-2 px-2 space-x-2">
                        <button
                          className="text-blue-600"
                          onClick={() => saveEdit(rule.id)}
                        >
                          Save
                        </button>
                        <button className="text-gray-600" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 px-2">{rule.keyword}</td>
                      <td className="py-2 px-2">{rule.target_type}</td>
                      <td className="py-2 px-2">{rule.target_value}</td>
                      <td className="py-2 px-2 space-x-2">
                        <button
                          className="text-blue-600"
                          onClick={() => startEdit(rule)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600"
                          onClick={() => deleteRule(rule.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-2 px-2 text-center text-gray-500">
                    No rules defined
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <form onSubmit={handleAddRule} className="flex flex-wrap gap-2">
            <input
              className="border p-2 rounded flex-1"
              placeholder="Keyword"
              value={newRule.keyword}
              onChange={(e) => setNewRule({ ...newRule, keyword: e.target.value })}
              required
            />
            <select
              className="border p-2 rounded"
              value={newRule.target_type}
              onChange={(e) => setNewRule({ ...newRule, target_type: e.target.value })}
            >
              <option value="tag">tag</option>
              <option value="category">category</option>
            </select>
            <input
              className="border p-2 rounded flex-1"
              placeholder="Target value"
              value={newRule.target_value}
              onChange={(e) => setNewRule({ ...newRule, target_value: e.target.value })}
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-2 rounded"
            >
              Add Rule
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MappingsSettings;