import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Track the last time we fetched user data so we don't spam the API
  const lastRefreshRef = useRef(0);
  const REFRESH_COOLDOWN_MS = 5000; // at most once every 5 seconds

  useEffect(() => {
    const token = localStorage.getItem('drivebeen_token');
    const savedUser = localStorage.getItem('drivebeen_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token is still valid
      authAPI.getMe()
        .then(({ data }) => {
          setUser(data.user);
          localStorage.setItem('drivebeen_user', JSON.stringify(data.user));
          lastRefreshRef.current = Date.now();
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('drivebeen_token', data.token);
    localStorage.setItem('drivebeen_user', JSON.stringify(data.user));
    setUser(data.user);
    lastRefreshRef.current = Date.now();
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    localStorage.setItem('drivebeen_token', data.token);
    localStorage.setItem('drivebeen_user', JSON.stringify(data.user));
    setUser(data.user);
    lastRefreshRef.current = Date.now();
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('drivebeen_token');
    localStorage.removeItem('drivebeen_user');
    lastRefreshRef.current = 0;
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('drivebeen_user', JSON.stringify(updatedUser));
    lastRefreshRef.current = Date.now();
  }, []);

  /**
   * refreshUser — fetches the latest user object (storageUsed, etc.) from the
   * backend and updates React state + localStorage.
   *
   * Rate-limited: silently skips the network call if called more frequently
   * than REFRESH_COOLDOWN_MS to avoid triggering rate-limiter (HTTP 429).
   */
  const refreshUser = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefreshRef.current < REFRESH_COOLDOWN_MS) {
      // Still within cooldown — skip the network call
      return;
    }
    lastRefreshRef.current = now;
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
      localStorage.setItem('drivebeen_user', JSON.stringify(data.user));
    } catch (e) {
      // Silently ignore — user data will be stale but app stays functional
      console.warn('refreshUser skipped or failed:', e?.response?.status);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
