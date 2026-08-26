import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api/client';
import { useIdleTimer } from '../hooks/useIdleTimer';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

interface AuthContextValue {
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState<string | null>(localStorage.getItem('ft_username'));

  const login = useCallback(async (u: string, p: string) => {
    const res = await api.login(u, p);
    localStorage.setItem('ft_token', res.token);
    localStorage.setItem('ft_username', res.username);
    setUsername(res.username);
  }, []);

  const register = useCallback(async (u: string, e: string, p: string) => {
    const res = await api.register(u, e, p);
    localStorage.setItem('ft_token', res.token);
    localStorage.setItem('ft_username', res.username);
    setUsername(res.username);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ft_token');
    localStorage.removeItem('ft_username');
    setUsername(null);
  }, []);

  // Auto-logout after IDLE_TIMEOUT_MS of no mouse/keyboard/scroll/touch activity.
  // Only runs while signed in.
  useIdleTimer(logout, IDLE_TIMEOUT_MS, !!username);

  return (
    <AuthContext.Provider value={{ username, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}