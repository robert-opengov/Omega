'use client';

import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge variant styles aligned with OpenGov Capital Design System semantic colors.
 *
 * Each semantic variant follows the OpenGov banner pattern:
 * background `*-light`, border `*-light-border`, text `*-text`.
 */
const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full font-medium tracking-[0.0125em]',
  {
    variants: {
      variant: {
        /** Neutral default badge with secondary background. */
        default: 'bg-secondary text-secondary-foreground',
        /** Positive / completed state. */
        success: 'bg-success-light border border-success-light-border text-success-text',
        /** Caution / attention state. */
        warning: 'bg-warning-light border border-warning-light-border text-warning-text',
        /** Error / destructive state. */
        danger: 'bg-danger-light border border-danger-light-border text-danger-text',
        /** Informational state. */
        info: 'bg-info-light border border-info-light-border text-info-text',
        /** In-progress / pending state (OpenGov purple). */
        inProgress: 'bg-in-progress-light border border-in-progress-light-border text-in-progress-text',
        /** Brand-tinted primary badge. */
        primary: 'bg-primary/10 text-primary',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

/**
 * A semantic status badge with multiple variants aligned to
 * OpenGov Capital Design System color scales.
 *
 * @example
 * <Badge variant="success">Approved</Badge>
 *
 * @example
 * <Badge variant="inProgress" size="sm">Pending</Badge>
 */
export function Badge({ variant, size, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { badgeVariants };
export default Badge;
