'use client';

import type { ElementType, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ThresholdProgress, type ThresholdProgressProps } from '@/components/ui/atoms';

const labeledProgressRowVariants = cva('flex items-center', {
  variants: {
    size: {
      sm: 'gap-2 py-1',
      md: 'gap-3 py-1.5',
      lg: 'gap-4 py-2',
    },
  },
  defaultVariants: { size: 'md' },
});

export interface LabeledProgressRowProps extends VariantProps<typeof labeledProgressRowVariants> {
  label: ReactNode;
  value: number;
  color?: ThresholdProgressProps['color'];
  icon?: ElementType;
  labelWidth?: string;
  className?: string;
}

export function LabeledProgressRow({
  label,
  value,
  color,
  icon: Icon,
  labelWidth = '140px',
  size,
  className,
}: LabeledProgressRowProps) {
  return (
    <div className={cn(labeledProgressRowVariants({ size }), className)}>
      <span
        className="inline-flex items-center gap-1 text-sm text-foreground shrink-0 truncate"
        style={{ minWidth: labelWidth }}
      >
        {Icon && <Icon className="h-3.5 w-3.5 text-warning shrink-0" aria-hidden="true" />}
        {label}
      </span>
      <ThresholdProgress
        value={value}
        size="sm"
        color={color}
        thresholds={Icon ? { warning: 0, danger: 100 } : undefined}
        className="flex-1"
      />
      <span className="text-xs font-medium text-muted-foreground w-10 text-right shrink-0">
        {value}%
      </span>
    </div>
  );
}

export default LabeledProgressRow;
