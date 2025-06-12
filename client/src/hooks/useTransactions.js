// src/hooks/useTransactions.js - Custom hook for transaction data
import { useState, useEffect } from 'react';
import { transactionService } from '../Services/transactionService';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transactionService.getAll();
      
      // Transform data to match your existing format
      const transformedData = data.map(transaction => ({
        ...transaction,
        // Ensure tags is a string (your API returns comma-separated tags)
        tags: transaction.tags || '',
        // Ensure amount is a number
        amount: parseFloat(transaction.amount)
      }));
      
      setTransactions(transformedData);
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
};


};