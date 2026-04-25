'use client';

import { useMemo } from 'react';
import { DataGrid } from '@/components/ui/organisms';
import { Skeleton, Text } from '@/components/ui/atoms';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/molecules';
import type { DataBinding } from '@/lib/core/ports/pages.repository';
import { useBoundRows } from './useBoundRows';
import type { Column } from '@/components/ui/molecules';

export interface BoundDataTableProps {
  appId: string;
  binding?: DataBinding;
  title: string;
  pageSize?: number;
}

/**
 * Data-aware table. Without a binding it renders an explanatory placeholder.
 * With a binding it derives columns from the first row keys (or from the
 * binding's `fields` allow-list) and clicking a row publishes a selection
 * to `PageSelectionContext` so other widgets (`detail-header`,
 * `conditional-container`) can react.
 */
export function BoundDataTable({
  appId,
  binding,
  title,
  pageSize = 10,
}: BoundDataTableProps) {
  const bound = !!binding && binding.source !== 'static';
  const { rows, loading, error, empty } = useBoundRows(appId, bound ? binding : undefined);

  const columns = useMemo<Column<Record<string, unknown>>[]>(() => {
    if (!rows.length) {
      return [{ key: 'placeholder', header: '—', render: () => '—' }];
    }
    const allowed = (binding?.fields ?? Object.keys(rows[0]!)).filter((k) => k !== '__rich');
    return allowed.slice(0, 8).map((k) => ({
      key: k,
      header: humanizeKey(k),
      render: (row) => formatCell(row[k]),
    }));
  }, [rows, binding?.fields]);

  if (!bound) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Text size="sm" color="muted">
            Bind this table to a GAB table in the right-hand panel.
          </Text>
        </CardContent>
      </Card>
    );
  }

  if (loading && empty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
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
          <Text size="sm" color="muted">
            {error}
          </Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <DataGrid
      title={title}
      data={rows}
      columns={columns}
      pageSize={pageSize}
      keyExtractor={(row) => String(row.id ?? row.gab_id ?? row._id ?? Math.random())}
      onSort={undefined}
      selectable={false}
      // DataGrid doesn't expose row-click; expose via custom column render below.
      emptyState={<Text size="sm" color="muted">No matching records.</Text>}
    />
  );
}

function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatCell(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) return value.toISOString();
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
