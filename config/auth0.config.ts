/**
 * Client-safe Auth0 configuration.
 *
 * Unlike gab.config.ts (server-only), this file is safe to import from
 * client components because it reads only NEXT_PUBLIC_ env vars.
 */
export const auth0Config = {
  /** Auth0 tenant domain (without https://) */
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '',

  /** Auth0 application client ID */
  clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '',

  /** Auth0 API audience identifier */
  audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || '',

  /** Whether the SSO login option is available */
  useExternalLogin: process.env.NEXT_PUBLIC_USE_EXTERNAL_LOGIN === 'true',

  /** OAuth scopes requested from Auth0 */
  scope: 'openid profile email',
} as const;
