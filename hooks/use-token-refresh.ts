'use client';

import { useEffect, useRef } from 'react';
import { AUTH_COOKIE_NAMES } from '@/lib/constants';
import { ssoCallbackAction } from '@/app/actions/auth';

/** Refresh 5 minutes before the token expires. */
const REFRESH_BUFFER_MS = 5 * 60 * 1000;
/** Minimum interval between refresh attempts (30 seconds). */
const MIN_REFRESH_INTERVAL_MS = 30 * 1000;
/** Default token lifetime when maxAge is unknown (2 hours). */
const DEFAULT_TOKEN_LIFETIME_MS = 2 * 60 * 60 * 1000;

/** Read a non-httpOnly cookie by name. */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const entry = document.cookie.split('; ').find((c) => c.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

/**
 * Proactively refreshes the Auth0 access token before it expires.
 *
 * For SSO sessions (`auth_provider === 'sso'`), this hook sets a timer
 * that calls `getTokenSilently()` on the Auth0 client and updates the
 * HTTP-only cookie via `ssoCallbackAction`.
 *
 * For password sessions, the backend refresh endpoint is used instead
 * (handled separately by the existing server actions).
 *
 * @param isAuthenticated - Whether the user is currently logged in.
 */
export function useTokenRefresh(isAuthenticated: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const provider = getCookie(AUTH_COOKIE_NAMES.authProvider);
    if (provider !== 'sso') return;

    function scheduleRefresh() {
      // Use default lifetime since we can't read httpOnly cookie expiry from JS.
      // The timer fires REFRESH_BUFFER_MS before the assumed expiry.
      const delay = Math.max(
        DEFAULT_TOKEN_LIFETIME_MS - REFRESH_BUFFER_MS,
        MIN_REFRESH_INTERVAL_MS,
      );

      timerRef.current = setTimeout(async () => {
        try {
          const { getAuth0Client } = await import('@/lib/auth0-client');
          const client = await getAuth0Client();
          const token = await client.getTokenSilently();
          await ssoCallbackAction(token, 7200);
        } catch (error) {
          console.error('Token refresh failed:', error);
          // If refresh fails with login_required, the user's Auth0 session
          // has expired. The next protected-route navigation will redirect
          // to /login via the middleware.
        }

        // Schedule the next refresh
        scheduleRefresh();
      }, delay);
    }

    scheduleRefresh();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAuthenticated]);
}
