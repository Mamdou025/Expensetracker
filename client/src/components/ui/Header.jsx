import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Brand, I } from '../../ui/BrandIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Logo from './Logo';
import LiquidGlassNav from '../liquid-glass-nav';

const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isOwner, isLoading, logout } = useAuth();

  const allNavItems = [
    { path: '/',                 label: t('navigation.dashboard'),       iconName: I.dashboard, requiresAuth: false },
    { path: '/accounts',         label: 'Mes banques',                   iconName: I.wallet,    requiresAuth: true  },
    { path: '/pdf-import',       label: t('navigation.pdfImport'),       iconName: I.upload,    requiresAuth: true  },
    { path: '/email-extraction', label: t('navigation.emailExtraction'), iconName: I.mail,      requiresAuth: true, ownerOnly: true },
    { path: '/chat',             label: t('navigation.chat'),            iconName: I.message,   requiresAuth: true  },
  ];

  const navItems = allNavItems.filter(item => {
    if (item.ownerOnly) return isOwner;
    if (item.requiresAuth) return isAuthenticated;
    return true;
  });

  /* Map navItems into the shape LiquidGlassNav expects */
  const glassItems = navItems.map((item) => ({
    href: item.path,
    label: item.label,
    icon: <Brand name={item.iconName} size={15} />,
  }));

  /* Derive activeIndex from current pathname */
  const activeIndex = (() => {
    const exact = navItems.findIndex((item) => item.path === location.pathname);
    if (exact !== -1) return exact;
    /* Fallback: longest prefix match */
    let best = 0;
    let bestLen = 0;
    navItems.forEach((item, i) => {
      if (item.path !== '/' && location.pathname.startsWith(item.path) && item.path.length > bestLen) {
        best = i;
        bestLen = item.path.length;
      }
    });
    return best;
  })();

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
    <header className="mb-6 pb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">

        {/* Logo */}
        <Link
          to="/"
          aria-label="exptrackr — accueil"
          className="flex items-baseline gap-3 hover:opacity-90 transition-opacity"
        >
          <Logo size="lg" />
        </Link>

        {/* Right side: nav + controls */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* Liquid-glass pill nav */}
          {glassItems.length > 0 && (
            <LiquidGlassNav
              items={glassItems}
              activeIndex={activeIndex}
              linkAs={Link}
            />
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              padding: '8px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.65)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.18s',
            }}
            title={theme === 'dark' ? t('header.lightMode', 'Mode clair') : t('header.darkMode', 'Mode sombre')}
          >
            <Brand name={theme === 'dark' ? I.sun : I.moon} size={16} />
          </button>

          {/* User avatar + dropdown */}
          {!isLoading && isAuthenticated && (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                style={{
                  borderRadius: '999px',
                  border: '1.5px solid rgba(255,255,255,0.18)',
                  padding: 0,
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={user?.email || ''}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="w-7 h-7 rounded-full" />
                ) : (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '999px',
                      background: '#10b981',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {initial}
                  </div>
                )}
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 z-50"
                  style={{
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(17,24,39,0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                    overflow: 'hidden',
                  }}
                >
                  {user?.email && (
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginBottom: 2 }}>
                        Connecté en tant que
                      </div>
                      <div
                        style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={user.email}
                      >
                        {user.email}
                      </div>
                    </div>
                  )}
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); logout(); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '9px 14px',
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.7)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                  >
                    <Brand name={I.logout} size={15} />
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
