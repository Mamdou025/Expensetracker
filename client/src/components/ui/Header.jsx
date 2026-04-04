import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Mail, FileUp, Building2 } from 'lucide-react';

const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const navItems = [
    { path: '/', label: t('navigation.dashboard'), icon: LayoutDashboard },
    { path: '/email-extraction', label: t('navigation.emailExtraction'), icon: Mail },
    { path: '/pdf-import', label: t('navigation.pdfImport'), icon: FileUp },
    { path: '/bank-templates', label: t('navigation.bankTemplates'), icon: Building2 },
  ];

  return (
    <header className="mb-6 border-b border-gray-200 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{t('header.title')}</h1>
        <nav className="flex gap-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Header;
