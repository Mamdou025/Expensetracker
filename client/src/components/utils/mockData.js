// src/utils/mockData.js
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

export default generateMockData;