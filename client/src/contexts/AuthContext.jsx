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

const apiCall = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  let data = {};
  try { data = await res.json(); } catch (_) { data = {}; }
  if (!res.ok) {
    const err = new Error(data.error || data.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/user`, { credentials: 'include' });
      if (res.ok) setUser(await res.json());
      else setUser(null);
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

  const login = useCallback(async (email, password) => {
    const u = await apiCall('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async ({ email, password, firstName, lastName }) => {
    const u = await apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await apiCall('/api/auth/logout', { method: 'POST' }); } catch (_) {}
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isOwner: !!user?.isOwner,
      isLoading,
      refresh,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
