import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const linkClasses = (path) =>
    `px-3 py-2 rounded-xl ${location.pathname === path ? 'bg-blue-600 text-white' : 'text-blue-600 hover:underline'}`;

  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-4xl font-bold text-gray-900">{t('header.title')}</h1>
      <nav className="space-x-2">
        <Link to="/" className={linkClasses('/')}>{t('navigation.dashboard')}</Link>
        <Link to="/email-extraction" className={linkClasses('/email-extraction')}>{t('navigation.emailExtraction')}</Link>
      </nav>
    </div>
  );
};

export default Header;
