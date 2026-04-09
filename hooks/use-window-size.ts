'use client';

import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width: globalThis.window === undefined ? 0 : globalThis.window.innerWidth,
    height: globalThis.window === undefined ? 0 : globalThis.window.innerHeight,
  });

  useEffect(() => {
    const handler = () => setSize({ width: globalThis.window.innerWidth, height: globalThis.window.innerHeight });
    globalThis.window.addEventListener('resize', handler);
    handler();
    return () => globalThis.window.removeEventListener('resize', handler);
  }, []);

  return size;
}
