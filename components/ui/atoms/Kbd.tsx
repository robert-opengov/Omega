'use client';

import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

/**
 * Keyboard shortcut indicator with a bordered, raised appearance.
 *
 * @example
 * <Kbd>⌘</Kbd>
 *
 * @example
 * <Kbd>Ctrl</Kbd> + <Kbd>S</Kbd>
 */
export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded border border-border bg-muted text-[11px] font-mono text-muted-foreground shadow-above',
        className
      )}
      {...props}
    />
  );
}

export default Kbd;
