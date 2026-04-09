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
 * Default colors are aligned with the OpenGov Capital Design System
 * (`@opengov/capital-style` v5.5.0) while preserving full HSL-based
 * dynamic theming with dark/light mode support.
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

export interface AppFeatures {
  enableDarkMode: boolean;
  enableI18n: boolean;
  enableNotifications: boolean;
}

export interface AppConfig {
  name: string;
  description: string;
  theme: AppTheme;
  logo?: {
    url?: string;
    alt?: string;
  };
  features: AppFeatures;
}

export const appConfig: AppConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'GAB Application',
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Powered by GAB',
  theme: {
    primary: process.env.NEXT_PUBLIC_THEME_PRIMARY || '#165CAB',
    primaryForeground: '#ffffff',
    secondary: process.env.NEXT_PUBLIC_THEME_SECONDARY || '#616365',
    success: process.env.NEXT_PUBLIC_THEME_SUCCESS || '#2FA882',
    warning: process.env.NEXT_PUBLIC_THEME_WARNING || '#E59539',
    danger: process.env.NEXT_PUBLIC_THEME_DANGER || '#D15336',
    info: process.env.NEXT_PUBLIC_THEME_INFO || '#4781BF',
    inProgress: process.env.NEXT_PUBLIC_THEME_IN_PROGRESS || '#885F99',
  },
  features: {
    enableDarkMode: true,
    enableI18n: false,
    enableNotifications: false,
  },
};
