/**
 * Centralized route configuration for the middleware.
 *
 * Protected route prefixes are AUTO-DERIVED from `navigationItems` in
 * `navigation.config.ts`. Only auth-only routes, public overrides, and
 * redirect targets need manual entries here.
 *
 * The middleware (`proxy.ts`) uses an implicit-deny pattern: any route
 * that is not public and not auth-only requires authentication. The
 * `protectedPrefixes` export makes the derived list explicit for
 * documentation, testing, and future role-based enforcement.
 *
 * @see {@link ./navigation.config.ts} — single source of truth for routes + nav
 */
import { collectProtectedPrefixes, navigationItems } from './navigation.config';

/** Routes accessible without authentication */
export const publicRoutes: string[] = [
  '/',
  '/callback-handler',
];

/** Route prefixes accessible without authentication (e.g., API endpoints) */
export const publicPrefixes: string[] = [
  '/api/auth/',
  '/pub/',
];

/** Routes that should redirect to home if the user is already authenticated */
export const authOnlyRoutes: string[] = [
  '/login',
  '/register',
  '/signup',
];

/**
 * All route prefixes that require authentication.
 * Auto-derived from `navigationItems` — no manual sync needed.
 */
export const protectedPrefixes: string[] = collectProtectedPrefixes(navigationItems);

/** The page to redirect unauthenticated users to */
export const loginRedirect = '/login';

/** The page to redirect authenticated users to when they hit an auth-only route */
export const homeRedirect = '/home';
