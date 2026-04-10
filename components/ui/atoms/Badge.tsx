'use client';

import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center font-medium tracking-[0.0125em]',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground',
        success: 'bg-success-light border border-success-light-border text-success-text',
        warning: 'bg-warning-light border border-warning-light-border text-warning-text',
        danger: 'bg-danger-light border border-danger-light-border text-danger-text',
        info: 'bg-info-light border border-info-light-border text-info-text',
        inProgress: 'bg-in-progress-light border border-in-progress-light-border text-in-progress-text',
        primary: 'bg-primary/10 text-primary',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
      shape: {
        pill: 'rounded-full',
        boxy: 'rounded',
      },
    },
    defaultVariants: { variant: 'default', size: 'md', shape: 'pill' },
  }
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ variant, size, shape, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size, shape }), className)} {...props} />;
}

export { badgeVariants };
export default Badge;
