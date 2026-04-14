'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const thresholdProgressVariants = cva('w-full overflow-hidden rounded-full bg-muted', {
  variants: {
    size: {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    },
    color: {
      primary: '',
      success: '',
      warning: '',
      danger: '',
      info: '',
    },
  },
  defaultVariants: { size: 'md', color: 'primary' },
});

const fillColorMap: Record<NonNullable<VariantProps<typeof thresholdProgressVariants>['color']>, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

export interface ThresholdProgressProps extends VariantProps<typeof thresholdProgressVariants> {
  /** Percentage filled (0-100) */
  value: number;
  /** Thresholds for dynamic color change (overrides `color` prop) */
  thresholds?: { warning: number; danger: number };
  /** Show the percentage label to the right */
  showLabel?: boolean;
  /** Custom format for the label */
  formatLabel?: (value: number) => string;
  /** Override the default aria-label */
  ariaLabel?: string;
  className?: string;
}

function getThresholdColor(value: number, thresholds: { warning: number; danger: number }): string {
  if (value >= thresholds.danger) return 'bg-danger';
  if (value >= thresholds.warning) return 'bg-warning';
  return 'bg-primary';
}

export function ThresholdProgress({ value, thresholds, showLabel, formatLabel, ariaLabel, size, color, className }: ThresholdProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const fillColor = thresholds
    ? getThresholdColor(clamped, thresholds)
    : fillColorMap[color ?? 'primary'];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(thresholdProgressVariants({ size }))}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', fillColor)}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={ariaLabel ?? `${clamped} percent`}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground shrink-0">
          {formatLabel ? formatLabel(clamped) : `${clamped}%`}
        </span>
      )}
    </div>
  );
}

export type ThresholdProgressColor = NonNullable<VariantProps<typeof thresholdProgressVariants>['color']>;

export { thresholdProgressVariants };
export default ThresholdProgress;
