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
import { AUTH_COOKIE_NAMES } from '@/lib/constants';
import { useTokenRefresh } from '@/hooks/use-token-refresh';

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
  /** Which auth provider was used: 'password' | 'sso' | null */
  authProvider: string | null;
  /** Whether SSO login is configured and available */
  isSsoEnabled: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  /** Re-read session from cookies into React state (call after SSO callback sets cookies). */
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Read a non-httpOnly cookie by name on the client. */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const entry = document.cookie.split('; ').find((c) => c.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authProvider, setAuthProvider] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    getCurrentUser()
      .then((u) => {
        setUser(u);
        setAuthProvider(getCookie(AUTH_COOKIE_NAMES.authProvider));
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const refreshSession = useCallback(async () => {
    const u = await getCurrentUser();
    setUser(u);
    setAuthProvider(getCookie(AUTH_COOKIE_NAMES.authProvider));
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
      setAuthProvider('password');
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
      // If this was an SSO session, clean up Auth0 SDK artifacts
      const provider = getCookie(AUTH_COOKIE_NAMES.authProvider);
      if (provider === 'sso') {
        try {
          const { clearAuth0Artifacts, resetAuth0Client } = await import('@/lib/auth0-client');
          clearAuth0Artifacts();
          resetAuth0Client();
        } catch {
          // Auth0 cleanup is best-effort
        }
      }

      await logoutAction();

      // Prevent silent re-login on the next login page load
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('fromLogoutRoute', '1');
      }
    } finally {
      setUser(null);
      setError(null);
      setAuthProvider(null);
      setIsLoading(false);
      startTransition(() => {
        if (typeof globalThis.window !== 'undefined') {
          globalThis.location.href = '/login';
        }
      });
    }
  }, []);

  // Proactively refresh SSO tokens before they expire
  useTokenRefresh(!!user);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';

  const isSsoEnabled = useMemo(
    () => process.env.NEXT_PUBLIC_USE_EXTERNAL_LOGIN === 'true',
    [],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isAdmin,
      isSuperAdmin,
      error,
      authProvider,
      isSsoEnabled,
      login,
      logout,
      refreshSession,
    }),
    [user, isLoading, isAdmin, isSuperAdmin, error, authProvider, isSsoEnabled, login, logout, refreshSession],
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
