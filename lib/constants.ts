export const APP_NAME = 'GAB Verticals Boilerplate';
export const APP_DESCRIPTION = 'AI-ready foundation for Government Apps';

export const SIDEBAR_STORAGE_KEY = 'gab-sidebar-collapsed';
export const THEME_STORAGE_KEY = 'gab-theme';

export const AUTH_COOKIE_NAMES = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  userInfo: 'user_info',
  /** Tracks which auth flow was used: 'password' | 'sso' */
  authProvider: 'auth_provider',
  /** Optional admin impersonation context for downstream API headers. */
  impersonationContext: 'impersonation_context',
} as const;
