'use client';

import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button, StatBadge, type StatBadgeProps } from '@/components/ui/atoms';
import type { ComponentAction } from '@/components/ui/types';

const deadlineItemVariants = cva('flex items-center rounded border border-border bg-card', {
  variants: {
    size: {
      sm: 'gap-3 px-3 py-2',
      md: 'gap-4 px-4 py-3',
      lg: 'gap-5 px-5 py-4',
    },
  },
  defaultVariants: { size: 'md' },
});

export interface DeadlineItemProps extends VariantProps<typeof deadlineItemVariants> {
  month: string;
  daysRemaining: number;
  title: ReactNode;
  description?: ReactNode;
  badgeVariant?: StatBadgeProps['variant'];
  /** Alternative leading element (replaces CountdownBadge) */
  leading?: ReactNode;
  action?: ComponentAction;
  className?: string;
}

export function DeadlineItem({
  month,
  daysRemaining,
  title,
  description,
  badgeVariant = 'danger',
  leading,
  action,
  size,
  className,
}: DeadlineItemProps) {
  return (
    <div className={cn(deadlineItemVariants({ size }), className)}>
      {leading || <StatBadge top={month} value={daysRemaining} label="Days" variant={badgeVariant} size="md" />}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">{title}</p>
        {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
      </div>
      {action && (
        <Button variant={action.variant || 'outline'} size="sm" onClick={action.onClick} icon={action.icon} className="shrink-0">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default DeadlineItem;
