import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Mail, FileUp, Building2, MessageCircle, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { path: '/', label: t('navigation.dashboard'), icon: LayoutDashboard },
    { path: '/email-extraction', label: t('navigation.emailExtraction'), icon: Mail },
    { path: '/pdf-import', label: t('navigation.pdfImport'), icon: FileUp },
    { path: '/bank-templates', label: t('navigation.bankTemplates'), icon: Building2 },
    { path: '/chat', label: t('navigation.chat'), icon: MessageCircle },
  ];

  return (
    <header className="mb-6 border-b border-gray-800 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-100 tracking-tight">{t('header.title')}</h1>
        <div className="flex items-center gap-2">
          <nav className="flex gap-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors nav-link ${
                    isActive
                      ? 'nav-active'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors ml-1"
            title={theme === 'dark' ? t('header.lightMode', 'Light mode') : t('header.darkMode', 'Dark mode')}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
