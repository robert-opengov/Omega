'use client';

import { cn } from '@/lib/utils';

export interface SkeletonProps {
  /** The shape of the skeleton placeholder. @default 'text' */
  variant?: 'text' | 'circular' | 'rectangular';
  className?: string;
  width?: string | number;
  height?: string | number;
}

/**
 * An animated placeholder skeleton for loading states.
 *
 * @example
 * <Skeleton variant="text" className="w-48" />
 *
 * @example
 * <Skeleton variant="circular" width={40} height={40} />
 */
export function Skeleton({ variant = 'text', className, width, height }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'animate-pulse bg-muted',
        variant === 'text' && 'h-4 rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-lg',
        className
      )}
      style={{ width, height }}
    />
  );
}

export default Skeleton;
