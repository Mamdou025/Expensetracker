
// src/components/ui/Header.jsx (Create this file)
import React from 'react';
import { useTranslation } from 'react-i18next';
 
const Header = ({ onSettingsToggle, showSettings }) => {
  const { t } = useTranslation();

  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-4xl font-bold text-gray-900">{t('header.title')}</h1>

    </div>
  );
};

export default Header;