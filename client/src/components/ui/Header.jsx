import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Brand, I } from '../../ui/BrandIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Logo from './Logo';

const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isOwner, isLoading, logout } = useAuth();

  const navItems = [
    { path: '/', label: t('navigation.dashboard'), iconName: I.dashboard, requiresAuth: false },
    { path: '/accounts', label: 'Mes banques', iconName: I.wallet, requiresAuth: true },
    { path: '/pdf-import', label: t('navigation.pdfImport'), iconName: I.upload, requiresAuth: true },
    { path: '/email-extraction', label: t('navigation.emailExtraction'), iconName: I.mail, requiresAuth: true, ownerOnly: true },
    { path: '/chat', label: t('navigation.chat'), iconName: I.message, requiresAuth: true },
  ].filter(item => {
    if (item.ownerOnly) return isOwner;
    if (item.requiresAuth) return isAuthenticated;
    return true;
  });

  const displayName = user?.firstName || user?.email || '';
  const initial = (displayName || '?').trim().charAt(0).toUpperCase();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <header className="mb-6 border-b border-gray-800 pb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          to="/"
          aria-label="exptrackr — accueil"
          className="flex items-baseline gap-3 hover:opacity-90 transition-opacity"
        >
          <Logo size="lg" />
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <nav className="flex gap-1 flex-wrap">
            {navItems.map(({ path, label, iconName }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors nav-link ${
                    isActive ? 'nav-active' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  <Brand name={iconName} size={16} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            title={theme === 'dark' ? t('header.lightMode', 'Mode clair') : t('header.darkMode', 'Mode sombre')}
          >
            <Brand name={theme === 'dark' ? I.sun : I.moon} size={16} />
          </button>

          {!isLoading && isAuthenticated && (
            <div ref={menuRef} className="relative pl-2 ml-1 border-l border-gray-800">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                title={user?.email || ''}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
                    {initial}
                  </div>
                )}
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-800 bg-gray-900 shadow-lg py-1 z-50"
                >
                  {user?.email && (
                    <div className="px-3 py-2 border-b border-gray-800">
                      <div className="text-xs text-gray-500">Connecté en tant que</div>
                      <div className="text-sm text-gray-200 truncate" title={user.email}>{user.email}</div>
                    </div>
                  )}
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors"
                  >
                    <Brand name={I.logout} size={16} />
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
