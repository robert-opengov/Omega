import { createAuth0Client, type Auth0Client } from '@auth0/auth0-spa-js';
import { auth0Config } from '@/config/auth0.config';

/**
 * Module-level singleton for the Auth0 SPA client.
 *
 * Lazily created on first call — subsequent calls return the same instance.
 * `useCookiesForTransactions` ensures the PKCE code_verifier survives the
 * full-page redirect to Auth0 and back.
 * `cacheLocation: 'memory'` — we do NOT store tokens in the browser;
 * they are forwarded to HTTP-only cookies via server actions.
 */
let clientPromise: Promise<Auth0Client> | null = null;

export function getAuth0Client(): Promise<Auth0Client> {
  clientPromise ??= createAuth0Client({
    domain: auth0Config.domain,
    clientId: auth0Config.clientId,
    authorizationParams: {
      redirect_uri: `${window.location.origin}/callback-handler`,
      audience: auth0Config.audience,
      scope: auth0Config.scope,
    },
    useRefreshTokens: true,
    useCookiesForTransactions: true,
    cacheLocation: 'memory',
  });
  return clientPromise;
}

/** Reset the cached client (used on logout to force re-initialization). */
export function resetAuth0Client(): void {
  clientPromise = null;
}

/**
 * Remove Auth0 SDK artifacts from storage.
 * The SDK stores transaction state under keys prefixed with `a0.spajs.`
 * and `@@auth0spajs@@`. This cleanup mirrors the Angular app's logout
 * flow that clears these before redirecting.
 */
export function clearAuth0Artifacts(): void {
  if (typeof window === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('a0.spajs.') || key.startsWith('@@auth0spajs@@'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
