'use client';

import { createContext, useState, useEffect, useCallback, useContext, type ReactNode } from 'react';
import { appConfig } from '@/config/app.config';
import { hexToHsl, DEFAULT_THEME } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_STORAGE_KEY = 'g-bp-theme';

const SEMANTIC_COLORS = [
  { key: 'primary', value: appConfig.theme.primary, fallback: DEFAULT_THEME.primary },
  { key: 'secondary', value: appConfig.theme.secondary, fallback: DEFAULT_THEME.secondary },
  { key: 'success', value: appConfig.theme.success, fallback: DEFAULT_THEME.success },
  { key: 'warning', value: appConfig.theme.warning, fallback: DEFAULT_THEME.warning },
  { key: 'danger', value: appConfig.theme.danger, fallback: DEFAULT_THEME.danger },
  { key: 'info', value: appConfig.theme.info, fallback: DEFAULT_THEME.info },
  { key: 'inProgress', value: appConfig.theme.inProgress, fallback: DEFAULT_THEME.inProgress },
] as const;

function injectHslVars() {
  const root = document.documentElement;
  for (const { key, value, fallback } of SEMANTIC_COLORS) {
    const hex = value || fallback;
    const { h, s, l } = hexToHsl(hex);
    root.style.setProperty(`--${key}-h`, String(h));
    root.style.setProperty(`--${key}-s`, `${s}%`);
    root.style.setProperty(`--${key}-l`, `${l}%`);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme | null>(null);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'light';
    setThemeState(saved);
    injectHslVars();
  }, []);

  const applyTheme = useCallback((t: Theme) => {
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    if (t === 'system') {
      const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      html.classList.add(sys);
      setResolvedTheme(sys);
    } else {
      html.classList.add(t);
      setResolvedTheme(t);
    }
  }, []);

  useEffect(() => {
    if (theme) applyTheme(theme);
  }, [theme, applyTheme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') applyTheme('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, applyTheme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    setThemeState(newTheme);
  };

  if (!theme) return null;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
