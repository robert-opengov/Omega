'use client';

import { useMemo } from 'react';
import { ChartCard, type ChartType } from '@/components/ui/organisms';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/molecules';
import { Skeleton, Text } from '@/components/ui/atoms';
import type { DataBinding } from '@/lib/core/ports/pages.repository';
import { useBoundRows } from './useBoundRows';

export interface BoundChartProps {
  appId: string;
  binding?: DataBinding;
  title: string;
  type: ChartType;
  /** Numeric value field on each row. */
  dataKey: string;
  /** Categorical / x-axis field on each row. */
  labelKey?: string;
}

/**
 * Data-aware chart. When unbound, shows a single-row demo dataset so the
 * editor preview makes sense without configuration.
 */
export function BoundChart({
  appId,
  binding,
  title,
  type,
  dataKey,
  labelKey = 'name',
}: BoundChartProps) {
  const bound = !!binding && binding.source !== 'static';
  const { rows, loading, error } = useBoundRows(appId, bound ? binding : undefined);

  const data = useMemo(() => {
    if (!bound) return [{ [labelKey]: 'Sample', [dataKey]: 1 }];
    return rows.map((r) => ({
      ...r,
      [labelKey]: r[labelKey] ?? '—',
      [dataKey]: typeof r[dataKey] === 'number' ? r[dataKey] : Number(r[dataKey] ?? 0),
    }));
  }, [bound, rows, labelKey, dataKey]);

  if (loading && bound) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Text size="sm" color="muted">{error}</Text>
        </CardContent>
      </Card>
    );
  }

  return <ChartCard title={title} type={type} data={data} dataKey={dataKey} xAxisKey={labelKey} />;
}
