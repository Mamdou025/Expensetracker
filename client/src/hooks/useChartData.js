// src/hooks/useChartData.js - Custom hook for chart data
import { useState, useEffect } from 'react';
import { transactionService } from '../Services/transactionService';

export const useChartData = (filteredTransactions) => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(false);

  // For real-time chart data based on filtered transactions
  useEffect(() => {
    if (filteredTransactions.length > 0) {
      generateChartData(filteredTransactions);
    }
  }, [filteredTransactions]);

  const generateChartData = (transactions) => {
    // Time chart data
    const dateGroups = transactions.reduce((acc, transaction) => {
      const date = transaction.date;
      if (!acc[date]) {
        acc[date] = { date, amount: 0, count: 0 };
      }
      acc[date].amount += Math.abs(transaction.amount);
      acc[date].count += 1;
      return acc;
    }, {});
    
    const timeData = Object.values(dateGroups).sort((a, b) => new Date(a.date) - new Date(b.date));
    setMonthlyData(timeData);

    // Category chart data
    const categoryGroups = transactions.reduce((acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = { name: category, value: 0, count: 0 };
      }
      acc[category].value += Math.abs(transaction.amount);
      acc[category].count += 1;
      return acc;
    }, {});
    
    setCategoryData(Object.values(categoryGroups));
  };

  // Load monthly data from API
  const loadMonthlySpending = async () => {
    try {
      setLoading(true);
      const data = await transactionService.getMonthlySpending();
      setMonthlyData(data);
    } catch (err) {
      console.error('Error loading monthly data:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    monthlyData,
    categoryData,
    loading,
    loadMonthlySpending
  };
};