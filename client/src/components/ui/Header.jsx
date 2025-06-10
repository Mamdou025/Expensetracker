
// src/components/ui/Header.jsx (Create this file)
import React from 'react';
import { Settings } from 'lucide-react';

const Header = ({ onSettingsToggle, showSettings }) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-4xl font-bold text-gray-900">Transaction Analytics</h1>
      <button
        onClick={onSettingsToggle}
        className="flex items-center gap-2 px-6 py-3 bg-white border rounded-2xl hover:bg-gray-50 shadow-lg transition-all duration-200"
      >
        <Settings className="w-5 h-5" />
        Configuration
      </button>
    </div>
  );
};

export default Header;