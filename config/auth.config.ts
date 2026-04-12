/**
 * Server-only authentication strategy configuration.
 *
 * Controls which login methods are available and how they behave.
 * Like gab.config.ts, this file reads non-NEXT_PUBLIC env vars and
 * must NEVER be imported from client components.
 *
 * The login mode is passed to the client via React Server Component
 * props (app/layout.tsx → Providers → AuthProvider), ensuring the
 * decision is server-controlled and not in the client JS bundle.
 */

export type LoginMode = 'password' | 'sso' | 'both';

const loginMode = (process.env.AUTH_LOGIN_MODE || 'both') as LoginMode;

export const authConfig = {
  /** Which login methods are available: 'password' | 'sso' | 'both' */
  loginMode,

  /**
   * Whether to attempt silent SSO login on the login page.
   *
   * When true and SSO is enabled, the login page tries
   * `getTokenSilently()` before showing the form. If the user has
   * an active Auth0 session they are redirected automatically.
   *
   * Defaults to `true` for sso-only mode (seamless experience)
   * and `false` for both mode (don't block the form with a spinner).
   */
  enableSilentLogin:
    process.env.AUTH_ENABLE_SILENT_LOGIN === undefined
      ? loginMode === 'sso'
      : process.env.AUTH_ENABLE_SILENT_LOGIN === 'true',
} as const;

export type AuthConfig = typeof authConfig;
