'use client';

import { useState, useCallback } from 'react';

export function useToggle(initial = false): [boolean, { toggle: () => void; on: () => void; off: () => void; set: (v: boolean) => void }] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  const on = useCallback(() => setValue(true), []);
  const off = useCallback(() => setValue(false), []);
  return [value, { toggle, on, off, set: setValue }];
}
