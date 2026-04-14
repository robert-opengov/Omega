'use client';

import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statBadgeVariants = cva(
  'inline-flex flex-col items-center justify-center rounded font-semibold leading-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        success: 'bg-success text-primary-foreground',
        warning: 'bg-warning text-primary-foreground',
        danger: 'bg-danger text-primary-foreground',
        info: 'bg-info text-primary-foreground',
        muted: 'bg-muted-foreground text-primary-foreground',
      },
      size: {
        sm: 'min-w-10 px-1.5 gap-0.5 py-1',
        md: 'min-w-12 px-2 gap-0.5 py-1.5',
        lg: 'min-w-14 px-2.5 gap-1 py-2',
      },
    },
    defaultVariants: { variant: 'danger', size: 'md' },
  },
);

const labelSizeMap = { sm: 'text-[10px]', md: 'text-[10px]', lg: 'text-xs' } as const;
const valueSizeMap = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' } as const;

export interface StatBadgeProps extends VariantProps<typeof statBadgeVariants> {
  /** Top label (e.g. month abbreviation, category) */
  top: ReactNode;
  /** Primary display value */
  value: ReactNode;
  /** Bottom label (e.g. unit, descriptor) */
  label?: ReactNode;
  className?: string;
}

export function StatBadge({ top, value, variant, size, label, className }: StatBadgeProps) {
  const resolvedSize = size ?? 'md';
  return (
    <div className={cn(statBadgeVariants({ variant, size }), className)}>
      <span className={cn(labelSizeMap[resolvedSize], 'uppercase tracking-wider')}>{top}</span>
      <span className={valueSizeMap[resolvedSize]}>{value}</span>
      {label && <span className={labelSizeMap[resolvedSize]}>{label}</span>}
    </div>
  );
}

export type StatBadgeVariant = NonNullable<VariantProps<typeof statBadgeVariants>['variant']>;

export { statBadgeVariants };
export default StatBadge;
