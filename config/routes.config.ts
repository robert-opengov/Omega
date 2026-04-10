/**
 * Centralized route configuration for the middleware.
 * The AI or the developer edits ONLY this file to control access rules.
 * The middleware.ts logic itself should never need to be touched.
 */

/** Routes accessible without authentication */
export const publicRoutes: string[] = [
  '/',
];

/** Route prefixes accessible without authentication (e.g., API endpoints) */
export const publicPrefixes: string[] = [
  '/api/auth/',
];

/** Routes that should redirect to home if the user is already authenticated */
export const authOnlyRoutes: string[] = [
  '/login',
  '/register',
  '/signup',
];

/** The page to redirect unauthenticated users to */
export const loginRedirect = '/login';

/** The page to redirect authenticated users to when they hit an auth-only route */
export const homeRedirect = '/home';
