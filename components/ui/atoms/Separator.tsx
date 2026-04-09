'use client';

import { cn } from '@/lib/utils';

export interface SeparatorProps {
  /** @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

/**
 * A visual divider (horizontal or vertical) using the `border` token color.
 *
 * @example
 * <Separator />
 *
 * @example
 * <Separator orientation="vertical" className="h-6" />
 */
export function Separator({ orientation = 'horizontal', className }: SeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full',
        className
      )}
    />
  );
}

export default Separator;
