'use client';

import { useMemo } from 'react';
import type {
  PivotAggregator,
  PivotReportConfig,
} from '@/lib/core/ports/report.repository';
import type { GabRow } from '@/lib/core/ports/data.repository';
import type { GabField } from '@/lib/core/ports/field.repository';
import { ViewerEmptyState } from './EmptyState';

export interface PivotReportViewerProps {
  config: PivotReportConfig;
  rows: GabRow[];
  fields: GabField[];
}

const TOTAL = '__total__';

function bucketLabel(raw: unknown): string {
  if (raw === null || raw === undefined || raw === '') return '—';
  return String(raw);
}

function aggregate(
  values: number[],
  agg: PivotAggregator,
  rawCount: number,
): number {
  if (agg === 'count') return rawCount;
  if (values.length === 0) return 0;
  switch (agg) {
    case 'sum':
      return values.reduce((s, n) => s + n, 0);
    case 'avg':
      return values.reduce((s, n) => s + n, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      return rawCount;
  }
}

interface PivotResult {
  rowLabels: string[];
  colLabels: string[];
  cells: Record<string, Record<string, number>>;
  rowKey: string;
  colKey: string | null;
  agg: PivotAggregator;
  valueKey: string | null;
  hasNoData: boolean;
}

function buildPivot(
  rows: GabRow[],
  config: PivotReportConfig,
): PivotResult | null {
  const rowKey = config.rows?.[0];
  if (!rowKey) return null;
  const colKey = config.cols?.[0] ?? null;
  const agg = config.aggregatorName ?? 'count';
  const valueKey = config.vals?.[0] ?? null;

  const rowSet = new Set<string>();
  const colSet = new Set<string>();
  // bucket: rowLabel -> colLabel -> values[]
  const buckets = new Map<string, Map<string, number[]>>();
  // for count: row -> col -> rawCount
  const counts = new Map<string, Map<string, number>>();

  for (const row of rows) {
    const r = bucketLabel(row?.[rowKey]);
    const c = colKey ? bucketLabel(row?.[colKey]) : TOTAL;
    rowSet.add(r);
    colSet.add(c);

    if (!buckets.has(r)) buckets.set(r, new Map());
    if (!counts.has(r)) counts.set(r, new Map());
    const rowMap = buckets.get(r)!;
    const countMap = counts.get(r)!;
    if (!rowMap.has(c)) rowMap.set(c, []);
    countMap.set(c, (countMap.get(c) ?? 0) + 1);

    if (agg !== 'count' && valueKey) {
      const raw = row?.[valueKey];
      const num = typeof raw === 'number' ? raw : Number(raw);
      if (Number.isFinite(num)) rowMap.get(c)!.push(num);
    }
  }

  const rowLabels = Array.from(rowSet).sort((a, b) => a.localeCompare(b));
  const colLabels = colKey
    ? Array.from(colSet).sort((a, b) => a.localeCompare(b))
    : [TOTAL];

  const cells: Record<string, Record<string, number>> = {};
  for (const r of rowLabels) {
    cells[r] = {};
    for (const c of colLabels) {
      const values = buckets.get(r)?.get(c) ?? [];
      const rawCount = counts.get(r)?.get(c) ?? 0;
      cells[r][c] = aggregate(values, agg, rawCount);
    }
  }

  return {
    rowLabels,
    colLabels,
    cells,
    rowKey,
    colKey,
    agg,
    valueKey,
    hasNoData: rowLabels.length === 0,
  };
}

function formatCell(value: number, agg: PivotAggregator): string {
  if (!Number.isFinite(value)) return '—';
  if (agg === 'count' || Number.isInteger(value)) return value.toString();
  return value.toFixed(2);
}

export function PivotReportViewer({
  config,
  rows,
  fields,
}: Readonly<PivotReportViewerProps>) {
  const fieldNameByKey = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of fields) m.set(f.key, f.name);
    return m;
  }, [fields]);

  const pivot = useMemo(() => buildPivot(rows, config), [rows, config]);

  if (!pivot) {
    return (
      <ViewerEmptyState
        title="Pick a row field"
        description="Choose at least one field to group records into rows."
      />
    );
  }

  if (pivot.hasNoData) {
    return (
      <ViewerEmptyState
        title="No data to pivot"
        description="There are no records to summarize."
      />
    );
  }

  const rowHeader =
    fieldNameByKey.get(pivot.rowKey) ?? pivot.rowKey;
  const valueLabel =
    pivot.agg === 'count'
      ? 'Count'
      : `${pivot.agg.toUpperCase()} of ${
          pivot.valueKey ? fieldNameByKey.get(pivot.valueKey) ?? pivot.valueKey : '—'
        }`;

  return (
    <div
      data-testid="pivot-report-viewer"
      className="overflow-x-auto rounded border border-border"
    >
      <table className="min-w-full text-sm">
        <thead className="bg-card">
          <tr>
            <th
              scope="col"
              className="border-b border-border px-3 py-2 text-left font-semibold text-foreground"
            >
              {rowHeader}
            </th>
            {pivot.colLabels.map((c) => (
              <th
                key={c}
                scope="col"
                className="border-b border-l border-border px-3 py-2 text-right font-semibold text-foreground"
              >
                {pivot.colKey ? c : valueLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pivot.rowLabels.map((r, idx) => (
            <tr key={r} className={idx % 2 === 1 ? 'bg-muted/30' : undefined}>
              <th
                scope="row"
                className="border-b border-border px-3 py-2 text-left font-medium text-foreground"
              >
                {r}
              </th>
              {pivot.colLabels.map((c) => (
                <td
                  key={c}
                  className="border-b border-l border-border px-3 py-2 text-right text-foreground tabular-nums"
                >
                  {formatCell(pivot.cells[r][c], pivot.agg)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { buildPivot };
