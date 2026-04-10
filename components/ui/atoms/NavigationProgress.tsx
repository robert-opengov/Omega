'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * A thin progress bar fixed at the top of the viewport that animates
 * during client-side navigations, providing visual feedback.
 *
 * Uses `z-[var(--z-overlay)]` from the CDS-37 z-index scale.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPathname = useRef(pathname);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const interval = useRef<ReturnType<typeof setInterval>>(undefined);

  const cleanup = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (interval.current) clearInterval(interval.current);
  }, []);

  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    cleanup();

    setProgress(90);
    setVisible(true);

    timer.current = setTimeout(() => {
      setProgress(100);
      timer.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
    }, 150);

    return cleanup;
  }, [pathname, cleanup]);

  const handleLinkClick = useCallback(() => {
    cleanup();
    setProgress(20);
    setVisible(true);

    let current = 20;
    interval.current = setInterval(() => {
      current += Math.random() * 10;
      if (current >= 80) {
        current = 80;
        if (interval.current) clearInterval(interval.current);
      }
      setProgress(current);
    }, 200);
  }, [cleanup]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;
      if (anchor.target === '_blank') return;
      if (href === pathname) return;

      handleLinkClick();
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [pathname, handleLinkClick]);

  if (!visible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[var(--z-overlay)] h-0.5 pointer-events-none">
      <div
        className={cn(
          'h-full bg-primary transition-all ease-out',
          visible ? 'opacity-100' : 'opacity-0',
          progress < 100 ? 'duration-300' : 'duration-150',
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
