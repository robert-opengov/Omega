'use client';

import { type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusDotVariants = cva('inline-block shrink-0 rounded-full', {
  variants: {
    color: {
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-danger',
      info: 'bg-info',
      muted: 'bg-muted-foreground',
      inProgress: 'bg-in-progress',
    },
    size: {
      sm: 'h-1.5 w-1.5',
      md: 'h-2.5 w-2.5',
      lg: 'h-3.5 w-3.5',
    },
  },
  defaultVariants: { color: 'muted', size: 'md' },
});

export interface StatusDotProps extends VariantProps<typeof statusDotVariants> {
  /** Optional text label displayed next to the dot */
  label?: ReactNode;
  className?: string;
}

export function StatusDot({ color, size, label, className }: StatusDotProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={statusDotVariants({ color, size })} aria-hidden="true" />
      {label && <span className="text-sm text-foreground">{label}</span>}
    </span>
  );
}

export { statusDotVariants };
export default StatusDot;
