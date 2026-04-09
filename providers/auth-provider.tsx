'use client';

import {
  createContext,
  useState,
  useCallback,
  useEffect,
  useContext,
  useMemo,
  useTransition,
  type ReactNode,
} from 'react';
import { getCurrentUser, loginAction, logoutAction, type SessionUser } from '@/app/actions/auth';

interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  /** True when `user.role` is "admin" or "superadmin". */
  isAdmin: boolean;
  /** True when `user.role` is "superadmin". */
  isSuperAdmin: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    getCurrentUser()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loginAction(username, password);
      if (!result.success) {
        setError(result.error || 'Authentication failed');
        return { success: false, error: result.error };
      }
      setUser(result.user ?? null);
      return { success: true };
    } catch {
      setError('An unexpected error occurred');
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutAction();
    } finally {
      setUser(null);
      setError(null);
      setIsLoading(false);
      startTransition(() => {
        if (typeof globalThis.window !== 'undefined') {
          globalThis.location.href = '/login';
        }
      });
    }
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isAdmin,
      isSuperAdmin,
      error,
      login,
      logout,
    }),
    [user, isLoading, isAdmin, isSuperAdmin, error, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
