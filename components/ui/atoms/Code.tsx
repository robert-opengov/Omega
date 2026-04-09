'use client';

import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

/**
 * Inline code snippet rendered with a muted background and monospace font.
 *
 * @example
 * <Code>npm install</Code>
 */
export function Code({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <code
      className={cn(
        'inline-flex px-1.5 py-0.5 rounded bg-muted text-sm font-mono text-foreground',
        className
      )}
      {...props}
    />
  );
}

export default Code;
