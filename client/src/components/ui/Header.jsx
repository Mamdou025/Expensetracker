
// src/components/ui/Header.jsx (Create this file)
import React from 'react';
 
const Header = ({ onSettingsToggle, showSettings }) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-4xl font-bold text-gray-900">Transaction Analytics</h1>

    </div>
  );
};

export default Header;