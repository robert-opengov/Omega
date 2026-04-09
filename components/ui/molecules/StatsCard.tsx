'use client';

import { cn } from '@/lib/utils';
import type { ElementType } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatsCardProps {
  title: string;
  value: string | number;
  /** Percentage change (positive = up, negative = down). */
  change?: number;
  changeLabel?: string;
  icon?: ElementType;
  className?: string;
}

/**
 * A KPI card showing a metric value with optional trend indicator.
 *
 * @example
 * <StatsCard title="Revenue" value="$12,400" change={8.2} changeLabel="vs last month" />
 */
export function StatsCard({ title, value, change, changeLabel, icon: Icon, className }: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className={cn('rounded-xl border border-border bg-card p-6 shadow-above', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      {change !== undefined && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-success-text" aria-hidden="true" />
          ) : (
            <TrendingDown className="h-3 w-3 text-danger-text" aria-hidden="true" />
          )}
          <span className={isPositive ? 'text-success-text' : 'text-danger-text'}>
            {isPositive ? '↑' : '↓'} {isPositive ? '+' : ''}{change.toFixed(1)}%
          </span>
          <span className="sr-only">{isPositive ? 'increase' : 'decrease'}</span>
          {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

export default StatsCard;
