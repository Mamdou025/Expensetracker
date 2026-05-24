import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Mail, FileUp, Building2, MessageCircle, Sun, Moon, LogIn, LogOut } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isOwner, isLoading, login, logout } = useAuth();

  const navItems = [
    { path: '/', label: t('navigation.dashboard'), icon: LayoutDashboard, requiresAuth: false },
    { path: '/email-extraction', label: t('navigation.emailExtraction'), icon: Mail, requiresAuth: true, ownerOnly: true },
    { path: '/pdf-import', label: t('navigation.pdfImport'), icon: FileUp, requiresAuth: true },
    { path: '/bank-templates', label: t('navigation.bankTemplates'), icon: Building2, requiresAuth: true },
    { path: '/chat', label: t('navigation.chat'), icon: MessageCircle, requiresAuth: true },
  ].filter(item => {
    if (item.ownerOnly) return isOwner;
    if (item.requiresAuth) return isAuthenticated;
    return true;
  });

  const displayName = user?.firstName || user?.email || '';
  const initial = (displayName || '?').trim().charAt(0).toUpperCase();

  return (
    <header className="mb-6 border-b border-gray-800 pb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold text-gray-100 tracking-tight">{t('header.title')}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <nav className="flex gap-1 flex-wrap">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors nav-link ${
                    isActive ? 'nav-active' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
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
            className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            title={theme === 'dark' ? t('header.lightMode', 'Light mode') : t('header.darkMode', 'Dark mode')}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {!isLoading && (
            isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 ml-1 border-l border-gray-800">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
                    {initial}
                  </div>
                )}
                <span className="hidden md:inline text-xs text-gray-400 max-w-[140px] truncate" title={user?.email}>
                  {displayName}
                </span>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors ml-1"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
