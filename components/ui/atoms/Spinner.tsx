'use client';

import { cn } from '@/lib/utils';

export interface SpinnerProps {
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
};

/**
 * An animated circular spinner used as a loading indicator.
 *
 * @example
 * <Spinner />
 *
 * @example
 * <Spinner size="lg" className="text-primary" />
 */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn('border-muted border-t-primary rounded-full animate-spin', sizeMap[size], className)}
      role="status"
      aria-label="Loading"
    />
  );
}

export default Spinner;
