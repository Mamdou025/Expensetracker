// src/hooks/useTransactions.js - Custom hook for transaction data
import { useState, useEffect } from 'react';
import { transactionService } from '../Services/transactionService';

export const useTransactions = ({ enabled = true } = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transactionService.getAll();
      
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTag = async (transactionId, tag) => {
    try {
      await transactionService.addTag(transactionId, tag);
      await loadTransactions(); // Reload to get updated data
    } catch (err) {
      console.error('Error adding tag:', err);
      setError(err.message);
      throw err;
    }
  };

  const removeTag = async (transactionId, tag) => {
    try {
      await transactionService.removeTag(transactionId, tag);
      await loadTransactions(); // Reload to get updated data
    } catch (err) {
      console.error('Error removing tag:', err);
      setError(err.message);
      throw err;
    }
  };

  const updateCategory = async (id, category) => {
    try {
      await transactionService.updateCategory(id, category);
      await loadTransactions(); // Reload to get updated data
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.message);
      throw err;
    }
  };



  // Add these methods to your existing useTransactions hook return object

// Add these methods inside your useTransactions function, before the return statement:

const updateAmount = async (id, amount) => {
  try {
    await transactionService.updateAmount(id, amount);
    await loadTransactions(); // Reload to get updated data
  } catch (err) {
    console.error('Error updating amount:', err);
    setError(err.message);
    throw err;
  }
};

const updateDescription = async (id, description) => {
  try {
    await transactionService.updateDescription(id, description);
    await loadTransactions(); // Reload to get updated data
  } catch (err) {
    console.error('Error updating description:', err);
    setError(err.message);
    throw err;
  }
};

const deleteTransaction = async (id) => {
  try {
    await transactionService.delete(id);
    await loadTransactions(); // Reload to get updated data
  } catch (err) {
    console.error('Error deleting transaction:', err);
    setError(err.message);
    throw err;
  }
};

// Update your return statement to include these new methods:
return {
  transactions,
  loading,
  error,
  refreshTransactions: loadTransactions,
  addTag,
  removeTag,
  updateCategory,
  updateAmount,
  updateDescription,
  deleteTransaction,
};


};