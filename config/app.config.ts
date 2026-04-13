/**
 * Centralized application configuration.
 * AI or developer edits this file to customize the generated app's
 * branding, features, and metadata — without touching any component code.
 *
 * Environment variables take precedence where available, falling back
 * to the defaults defined here.
 *
 * ## Theme system
 *
 * Every color in `theme` is a hex string that gets decomposed into HSL
 * components at runtime (see `ThemeProvider`). CSS custom properties like
 * `--primary-h`, `--primary-s`, `--primary-l` are set on `:root`, and
 * all derived shades (backgrounds, borders, text) are computed via
 * CSS `hsl()` + `calc()`. Changing one hex value here cascades to
 * the entire shade scale for that semantic color.
 *
 * ## OpenGov Capital Design System alignment
 *
 * Default colors are aligned with the OpenGov CDS-37 design system
 * (MUI-based) while preserving full HSL-based dynamic theming with
 * dark/light mode support.
 */

export interface AppTheme {
  /** Main brand color — buttons, links, rings, active states */
  primary: string;
  /** Foreground color on primary backgrounds */
  primaryForeground: string;
  /** Secondary accent — muted UI, secondary buttons */
  secondary: string;
  /** Positive / success states — badges, alerts, toasts */
  success: string;
  /** Caution states — badges, alerts, toasts */
  warning: string;
  /** Destructive / error states — badges, alerts, toasts, delete actions */
  danger: string;
  /** Informational states — badges, alerts, toasts */
  info: string;
  /** In-progress / pending states — badges, alerts, toasts */
  inProgress: string;
}

/**
 * Controls which chrome (navbar, sidebar, or both) is rendered around the
 * main content area. Each mode maps to a Figma reference layout:
 *
 * - `navbar-sidebar` — Top navbar + left sidebar (GAB Horizontal)
 * - `navbar-only`    — Full-width top navbar, no sidebar (PSP-style)
 * - `sidebar-only`   — Left sidebar only, no top navbar
 * - `none`           — No chrome at all (landing pages, kiosk apps)
 */
export type LayoutMode = 'navbar-sidebar' | 'navbar-only' | 'sidebar-only' | 'none';

export interface AppLayout {
  mode: LayoutMode;
  /** Whether the top navbar is rendered. Defaults to `true`. */
  showNavbar: boolean;
  /** Whether the left sidebar is rendered. Defaults to `true`. */
  showSidebar: boolean;
}

export interface AppFeatures {
  enableDarkMode: boolean;
  enableI18n: boolean;
  enableNotifications: boolean;
  /** Show /signup route and "Sign up" links in the login form */
  enableSignup: boolean;
  /** Show Grants vertical in navigation and routes */
  enableGrants: boolean;
  /** Show 311 vertical in navigation and routes */
  enable311: boolean;
}

export interface AppConfig {
  name: string;
  description: string;
  theme: AppTheme;
  layout: AppLayout;
  logo: {
    url?: string;
    alt?: string;
  };
  features: AppFeatures;
}

function deriveLayoutMode(navbar: boolean, sidebar: boolean): LayoutMode {
  if (navbar && sidebar) return 'navbar-sidebar';
  if (navbar) return 'navbar-only';
  if (sidebar) return 'sidebar-only';
  return 'none';
}

const legacyMode = process.env.NEXT_PUBLIC_LAYOUT_MODE as LayoutMode | undefined;

const showNavbar = legacyMode
  ? legacyMode !== 'sidebar-only'
  : process.env.NEXT_PUBLIC_SHOW_NAVBAR !== 'false';

const showSidebar = legacyMode
  ? legacyMode !== 'navbar-only'
  : process.env.NEXT_PUBLIC_SHOW_SIDEBAR !== 'false';

export const appConfig: AppConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'GAB Application',
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Powered by GAB',
  theme: {
    primary: process.env.NEXT_PUBLIC_THEME_PRIMARY || '#4B3FFF',
    primaryForeground: '#ffffff',
    secondary: process.env.NEXT_PUBLIC_THEME_SECONDARY || '#757575',
    success: process.env.NEXT_PUBLIC_THEME_SUCCESS || '#2E7D32',
    warning: process.env.NEXT_PUBLIC_THEME_WARNING || '#ED6C02',
    danger: process.env.NEXT_PUBLIC_THEME_DANGER || '#D32F2F',
    info: process.env.NEXT_PUBLIC_THEME_INFO || '#0288D1',
    inProgress: process.env.NEXT_PUBLIC_THEME_IN_PROGRESS || '#7B1FA2',
  },
  logo: {
    url: process.env.NEXT_PUBLIC_LOGO_URL || undefined,
    alt: process.env.NEXT_PUBLIC_APP_NAME || 'Application Logo',
  },
  layout: {
    showNavbar,
    showSidebar,
    mode: legacyMode || deriveLayoutMode(showNavbar, showSidebar),
  },
  features: {
    enableDarkMode:      process.env.NEXT_PUBLIC_ENABLE_DARK_MODE !== 'false',
    enableI18n:          process.env.NEXT_PUBLIC_ENABLE_I18N === 'true',
    enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
    enableSignup:        process.env.NEXT_PUBLIC_ENABLE_SIGNUP !== 'false',
    enableGrants:        process.env.NEXT_PUBLIC_ENABLE_GRANTS === 'true',
    enable311:           process.env.NEXT_PUBLIC_ENABLE_311 === 'true',
  },
};
