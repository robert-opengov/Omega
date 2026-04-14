'use client';

import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ThresholdProgress, type ThresholdProgressProps } from '@/components/ui/atoms';

const breakdownCardVariants = cva('rounded border border-border bg-card', {
  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: { size: 'md' },
});

const headerSizeMap = { sm: 'p-3 pb-1.5', md: 'p-4 pb-2', lg: 'p-5 pb-2.5' } as const;
const segmentSizeMap = { sm: 'p-3', md: 'p-4', lg: 'p-5' } as const;
const detailSizeMap = { sm: 'p-3', md: 'p-4', lg: 'p-5' } as const;

export interface BreakdownSegment {
  label: string;
  value: string;
  sublabel?: string;
}

export interface BreakdownCardProps extends VariantProps<typeof breakdownCardVariants> {
  title: ReactNode;
  description?: ReactNode;
  segments: BreakdownSegment[];
  progressValue?: number;
  progressColor?: ThresholdProgressProps['color'];
  progressThresholds?: { warning: number; danger: number };
  details?: Array<{ label: string; value: string }>;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}

export function BreakdownCard({
  title,
  description,
  segments,
  progressValue,
  progressColor,
  progressThresholds,
  details,
  action,
  size,
  className,
}: BreakdownCardProps) {
  const resolvedSize = size ?? 'md';

  return (
    <div className={cn(breakdownCardVariants({ size }), className)}>
      <div className={cn('flex items-start justify-between', headerSizeMap[resolvedSize])}>
        <div>
          <h4 className="text-base font-semibold text-foreground">{title}</h4>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action && (
          action.href ? (
            <a href={action.href} className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
              {action.label} &rsaquo;
            </a>
          ) : action.onClick ? (
            <button type="button" onClick={action.onClick} className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
              {action.label} &rsaquo;
            </button>
          ) : null
        )}
      </div>

      <div
        className="grid gap-px bg-border mx-4"
        style={{ gridTemplateColumns: `repeat(${segments.length}, minmax(0, 1fr))` }}
      >
        {segments.map((seg) => (
          <div key={seg.label} className={cn('bg-card', segmentSizeMap[resolvedSize])}>
            <p className="text-xs text-muted-foreground">{seg.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{seg.value}</p>
            {seg.sublabel && <p className="text-sm text-muted-foreground mt-1">{seg.sublabel}</p>}
          </div>
        ))}
      </div>

      {progressValue !== undefined && (
        <div className="px-4 pt-2">
          <ThresholdProgress
            value={progressValue}
            size="md"
            color={progressColor}
            thresholds={progressThresholds}
          />
        </div>
      )}

      {details && details.length > 0 && (
        <div className={cn('grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3', detailSizeMap[resolvedSize])}>
          {details.map((d) => (
            <div key={d.label} className="flex items-baseline gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">{d.label}</span>
              <span className="text-xs font-medium text-foreground">{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BreakdownCard;
