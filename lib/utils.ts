import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ------------------------------------------------------------------ */
/*  Color utilities — HSL decomposition for the dynamic theme system  */
/* ------------------------------------------------------------------ */

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

/**
 * Convert a hex color string to HSL components.
 * Accepts 3-char (#abc) or 6-char (#aabbcc) hex with optional leading #.
 */
export function hexToHsl(hex: string): HslColor {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];

  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let hue = 0;
  if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) hue = ((b - r) / d + 2) / 6;
  else hue = ((r - g) / d + 4) / 6;

  return {
    h: Math.round(hue * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Build the CSS custom property declarations for a single semantic color.
 * Returns a string like `--primary-h:245;--primary-s:100%;--primary-l:63%;`
 */
export function hslCssVars(prefix: string, { h, s, l }: HslColor): string {
  return `--${prefix}-h:${h};--${prefix}-s:${s}%;--${prefix}-l:${l}%;`;
}

/**
 * Default theme hex values — used as fallbacks throughout the system.
 * Aligned with OpenGov Capital Design System (`@opengov/capital-style` v5.5.0).
 */
export const DEFAULT_THEME = {
  primary: '#165CAB',
  secondary: '#616365',
  success: '#2FA882',
  warning: '#E59539',
  danger: '#D15336',
  info: '#4781BF',
  inProgress: '#885F99',
} as const;
