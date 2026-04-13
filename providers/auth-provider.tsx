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
import type { LoginMode } from '@/config/auth.config';
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
  isAdmin: boolean;
  isSuperAdmin: boolean;
  /** Which auth provider was used for the current session: 'password' | 'sso' | null */
  authProvider: string | null;
  /** Whether the entire auth system is enabled (server-decided) */
  enableAuth: boolean;
  /** Server-decided login mode for this deployment */
  loginMode: LoginMode;
  /** Whether password login is available (derived from loginMode) */
  isPasswordEnabled: boolean;
  /** Whether SSO login is available (derived from loginMode) */
  isSsoEnabled: boolean;
  /** Whether to attempt silent SSO login (server-decided) */
  enableSilentLogin: boolean;
  /** Whether self-registration is available */
  enableSignup: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const entry = document.cookie.split('; ').find((c) => c.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

interface AuthProviderProps {
  children: ReactNode;
  enableAuth?: boolean;
  loginMode?: LoginMode;
  enableSilentLogin?: boolean;
  enableSignup?: boolean;
}

export function AuthProvider({
  children,
  enableAuth = true,
  loginMode = 'both',
  enableSilentLogin = false,
  enableSignup = true,
}: AuthProviderProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authProvider, setAuthProvider] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const isSsoEnabled = loginMode === 'sso' || loginMode === 'both';
  const isPasswordEnabled = loginMode === 'password' || loginMode === 'both';

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

  useTokenRefresh(!!user);

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
      authProvider,
      enableAuth,
      loginMode,
      isPasswordEnabled,
      isSsoEnabled,
      enableSilentLogin,
      enableSignup,
      login,
      logout,
      refreshSession,
    }),
    [user, isLoading, isAdmin, isSuperAdmin, error, authProvider, enableAuth, loginMode, isPasswordEnabled, isSsoEnabled, enableSilentLogin, enableSignup, login, logout, refreshSession],
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
