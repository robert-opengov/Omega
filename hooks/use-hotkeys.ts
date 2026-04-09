'use client';

import { useEffect, useCallback } from 'react';

interface HotkeyOptions {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  enabled?: boolean;
}

export function useHotkeys(
  key: string,
  callback: (e: KeyboardEvent) => void,
  options: HotkeyOptions = {}
): void {
  const { ctrl, meta, shift, alt, enabled = true } = options;

  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      if (ctrl && !e.ctrlKey) return;
      if (meta && !e.metaKey) return;
      if (shift && !e.shiftKey) return;
      if (alt && !e.altKey) return;

      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (target.isContentEditable) return;

      e.preventDefault();
      callback(e);
    },
    [key, callback, ctrl, meta, shift, alt, enabled]
  );

  useEffect(() => {
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handler]);
}
