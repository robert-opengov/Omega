'use client';

import { useMemo } from 'react';
import { ChartCard } from '@/components/ui/organisms/ChartCard';
import type {
  ChartKind,
  ChartReportConfig,
} from '@/lib/core/ports/report.repository';
import type { GabRow } from '@/lib/core/ports/data.repository';
import { ViewerEmptyState } from './EmptyState';

export interface ChartReportViewerProps {
  config: ChartReportConfig;
  rows: GabRow[];
}

const VALUE_KEY = '__value__';

/**
 * Aggregate rows by the configured x-axis field. When the y-axis field is
 * numeric we sum it across rows in each bucket; otherwise we count rows.
 *
 * Output rows look like `{ name: <bucket label>, __value__: number }` so we
 * can pass a single, stable `dataKey` to the ChartCard regardless of the
 * underlying field name.
 */
function aggregateRows(
  rows: GabRow[],
  xKey: string | undefined,
  yKey: string | undefined,
): Record<string, unknown>[] {
  if (!xKey) return [];
  const buckets = new Map<string, number>();
  for (const row of rows) {
    const rawX = row?.[xKey];
    const bucket =
      rawX === null || rawX === undefined || rawX === '' ? '—' : String(rawX);
    const current = buckets.get(bucket) ?? 0;
    if (yKey) {
      const yRaw = row?.[yKey];
      const yNum = typeof yRaw === 'number' ? yRaw : Number(yRaw);
      buckets.set(bucket, current + (Number.isFinite(yNum) ? yNum : 0));
    } else {
      buckets.set(bucket, current + 1);
    }
  }
  return Array.from(buckets.entries()).map(([name, value]) => ({
    name,
    [VALUE_KEY]: value,
  }));
}

export function ChartReportViewer({
  config,
  rows,
}: Readonly<ChartReportViewerProps>) {
  const chartType: ChartKind = config.chartType ?? 'bar';
  const data = useMemo(
    () => aggregateRows(rows, config.xAxis, config.yAxis),
    [rows, config.xAxis, config.yAxis],
  );

  if (!config.xAxis) {
    return (
      <ViewerEmptyState
        title="Pick an X axis field"
        description="Choose a categorical field on the left to group records into chart series."
      />
    );
  }

  if (data.length === 0) {
    return (
      <ViewerEmptyState
        title="No data to chart"
        description="There are no records yet, or every record is missing the X axis value."
      />
    );
  }

  const valueLabel = config.yAxis
    ? `Sum of ${config.yAxis}`
    : 'Record count';

  return (
    <div data-testid="chart-report-viewer">
      <ChartCard
        title={valueLabel}
        type={chartType}
        data={data}
        dataKey={VALUE_KEY}
        xAxisKey="name"
      />
    </div>
  );
}

export { aggregateRows };
