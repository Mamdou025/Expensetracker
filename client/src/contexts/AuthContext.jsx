import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  refresh: () => {},
});

const API_BASE = (() => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL.replace(/\/$/, '');
  if (typeof window !== 'undefined' &&
      ['localhost', '127.0.0.1'].includes(window.location.hostname) &&
      window.location.port === '3000') {
    return 'http://localhost:5000';
  }
  return '';
})();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/user`, { credentials: 'include' });
      if (res.status === 401) {
        setUser(null);
      } else if (res.ok) {
        setUser(await res.json());
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const onUnauth = () => setUser(null);
    window.addEventListener('app:unauthorized', onUnauth);
    return () => window.removeEventListener('app:unauthorized', onUnauth);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isOwner: !!user?.isOwner,
      isLoading,
      refresh,
      login: () => { window.location.href = `${API_BASE}/api/login`; },
      logout: () => { window.location.href = `${API_BASE}/api/logout`; },
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
