/**
 * Client-safe Auth0 SDK configuration.
 *
 * These values are inherently public (they appear in every Auth0
 * redirect URL) and are safe as NEXT_PUBLIC_ env vars. The Auth0
 * SPA SDK needs them in the browser for PKCE flows.
 *
 * The DECISION of whether SSO is enabled lives in config/auth.config.ts
 * (server-only) and is passed to the client via React Server Component
 * props — never as a client-side env var.
 */
export const auth0Config = {
  /** Auth0 tenant domain (without https://) */
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '',

  /** Auth0 application client ID */
  clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '',

  /** Auth0 API audience identifier */
  audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || '',

  /** OAuth scopes requested from Auth0 */
  scope: 'openid profile email',
} as const;
