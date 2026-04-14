'use client';

import type { ReactNode, ElementType } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const metricCardVariants = cva('rounded', {
  variants: {
    variant: {
      default: 'bg-card border border-border',
      outlined: 'bg-transparent border border-border',
      ghost: 'bg-transparent',
    },
    size: {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-5',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
});

const valueSizeMap = { sm: 'text-2xl', md: 'text-3xl', lg: 'text-4xl' } as const;

export interface MetricCardProps extends VariantProps<typeof metricCardVariants> {
  title: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  /** Optional trend indicator rendered below the value */
  trend?: ReactNode;
  /** Top-right icon */
  icon?: ElementType;
  children?: ReactNode;
  className?: string;
}

export function MetricCard({ title, value, description, trend, icon: Icon, children, variant, size, className }: MetricCardProps) {
  const resolvedSize = size ?? 'md';
  return (
    <div className={cn(metricCardVariants({ variant, size }), className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
      </div>
      <p className={cn('mt-1 font-bold tracking-tight text-foreground', valueSizeMap[resolvedSize])}>{value}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      {trend && <div className="mt-1">{trend}</div>}
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}

export { metricCardVariants };
export default MetricCard;
