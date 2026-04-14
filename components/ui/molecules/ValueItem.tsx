'use client';

import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button, Chip, type ChipColor } from '@/components/ui/atoms';
import type { ComponentAction, ValueColor } from '@/components/ui/types';
import { VALUE_COLOR_MAP } from '@/components/ui/types';

const valueItemVariants = cva('', {
  variants: {
    layout: {
      card: 'rounded border border-border bg-card',
      row: 'border-b border-border last:border-b-0',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  compoundVariants: [
    { layout: 'card', size: 'sm', className: 'p-3 space-y-2' },
    { layout: 'card', size: 'md', className: 'p-4 space-y-4' },
    { layout: 'card', size: 'lg', className: 'p-5 space-y-5' },
    { layout: 'row', size: 'sm', className: 'gap-2 py-2' },
    { layout: 'row', size: 'md', className: 'gap-3 py-3' },
    { layout: 'row', size: 'lg', className: 'gap-4 py-4' },
  ],
  defaultVariants: { layout: 'card', size: 'md' },
});

export interface ValueItemProps extends VariantProps<typeof valueItemVariants> {
  value: ReactNode;
  valueColor?: ValueColor;
  title: ReactNode;
  description?: ReactNode;
  actions?: ComponentAction[];
  /** Trailing meta slot (e.g. waiting indicator, avatar) */
  meta?: ReactNode;
  /** Tag chip displayed alongside description */
  tag?: ReactNode;
  tagColor?: ChipColor;
  /** Timestamp or date displayed in the top-right area */
  timestamp?: ReactNode;
  className?: string;
}

export function ValueItem({
  value,
  valueColor = 'muted',
  title,
  description,
  actions,
  meta,
  tag,
  tagColor = 'primary',
  timestamp,
  layout,
  size,
  className,
}: ValueItemProps) {
  const resolvedLayout = layout ?? 'card';
  const isRow = resolvedLayout === 'row';

  return (
    <div className={cn(valueItemVariants({ layout, size }), isRow && 'flex items-start', className)}>
      <div className={cn('flex items-center', isRow ? 'gap-3 w-full' : 'gap-4')}>
        <span className={cn('font-semibold shrink-0', isRow ? 'text-sm w-24 text-right' : 'text-base', VALUE_COLOR_MAP[valueColor])}>
          {value}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className={cn('font-medium text-foreground truncate', isRow ? 'text-sm' : 'text-base font-semibold')}>{title}</p>
            {timestamp && <span className="text-xs text-muted-foreground shrink-0">{timestamp}</span>}
          </div>
          {(description || tag) && (
            <div className="flex items-center gap-1.5 mt-0.5">
              {description && <p className={cn('text-muted-foreground truncate', isRow ? 'text-xs' : 'text-sm')}>{description}</p>}
              {tag && typeof tag === 'string' ? <Chip label={tag} color={tagColor} size="sm" /> : tag}
            </div>
          )}
        </div>
      </div>
      {(actions?.length || meta) && (
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            {actions?.map((action) => (
              <Button key={action.label} variant={action.variant || 'outline'} size="sm" onClick={action.onClick} icon={action.icon}>
                {action.label}
              </Button>
            ))}
          </div>
          {meta && <div className="shrink-0">{meta}</div>}
        </div>
      )}
    </div>
  );
}

export { valueItemVariants };
export default ValueItem;
