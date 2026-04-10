'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const progressVariants = cva('relative w-full overflow-hidden rounded-full bg-muted', {
  variants: {
    size: {
      sm: 'h-1.5',
      md: 'h-2.5',
      lg: 'h-4',
    },
  },
  defaultVariants: { size: 'md' },
});

export interface ProgressProps
  extends ProgressPrimitive.ProgressProps,
    VariantProps<typeof progressVariants> {
  /** Show a percentage label above the bar. */
  showLabel?: boolean;
}

/**
 * A horizontal progress bar built on Radix UI.
 *
 * @example
 * <Progress value={45} />
 *
 * @example
 * <Progress value={80} size="lg" showLabel />
 */
const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, size, showLabel, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {showLabel && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{value}%</span>
          </div>
        )}
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(progressVariants({ size, className }))}
          value={value}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className="h-full bg-primary transition-all duration-200 ease-in-out rounded-full"
            style={{ width: `${value}%` }}
          />
        </ProgressPrimitive.Root>
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress, progressVariants };
export default Progress;
