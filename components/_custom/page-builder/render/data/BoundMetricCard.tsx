'use client';

import { useMemo } from 'react';
import { MetricCard } from '@/components/ui/molecules';
import { Skeleton } from '@/components/ui/atoms';
import type { DataBinding } from '@/lib/core/ports/pages.repository';
import { useBoundRows } from './useBoundRows';

export interface BoundMetricCardProps {
  appId: string;
  binding?: DataBinding;
  label: string;
  /** Static fallback value when no binding is configured. */
  staticValue: string;
  /**
   * One of:
   *   - `count` — number of rows after filtering (default).
   *   - `sum` / `avg` / `min` / `max` — aggregate `valueField` across rows.
   *   - `first` — value of `valueField` on the first row.
   */
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'first';
  valueField?: string;
}

/**
 * Data-aware metric card. Falls back to the static `value` prop when no
 * binding is set so authors can preview a card before wiring it up.
 */
export function BoundMetricCard({
  appId,
  binding,
  label,
  staticValue,
  aggregation = 'count',
  valueField,
}: BoundMetricCardProps) {
  const bound = !!binding && binding.source !== 'static';
  const { rows, total, loading, error } = useBoundRows(
    appId,
    bound ? binding : undefined,
  );

  const value = useMemo(() => {
    if (!bound) return staticValue;
    if (loading) return '…';
    if (error) return '—';
    return computeAggregate(rows, total, aggregation, valueField);
  }, [bound, staticValue, loading, error, rows, total, aggregation, valueField]);

  if (loading && bound) {
    return (
      <div className="rounded border border-border bg-card p-4">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-7 w-16" />
      </div>
    );
  }

  return <MetricCard title={label} value={value} description={error ?? undefined} />;
}

function computeAggregate(
  rows: Array<Record<string, unknown>>,
  total: number,
  agg: NonNullable<BoundMetricCardProps['aggregation']>,
  field: string | undefined,
): string {
  if (agg === 'count') return String(total);
  if (!field) return '—';
  const numeric: number[] = [];
  for (const r of rows) {
    const raw = r[field];
    const n = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isFinite(n)) numeric.push(n);
  }
  if (numeric.length === 0) return agg === 'first' ? '—' : '0';
  switch (agg) {
    case 'sum':
      return formatNumber(numeric.reduce((a, b) => a + b, 0));
    case 'avg':
      return formatNumber(numeric.reduce((a, b) => a + b, 0) / numeric.length);
    case 'min':
      return formatNumber(Math.min(...numeric));
    case 'max':
      return formatNumber(Math.max(...numeric));
    case 'first': {
      const raw = rows[0]?.[field];
      return raw == null ? '—' : String(raw);
    }
    default:
      return String(total);
  }
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
