'use client';

import { useMemo } from 'react';
import { KanbanBoard, type KanbanColumn } from '@/components/ui/organisms';
import { Skeleton, Text } from '@/components/ui/atoms';
import { Card, CardContent } from '@/components/ui/molecules';
import type { DataBinding } from '@/lib/core/ports/pages.repository';
import { useBoundRows } from './useBoundRows';

export interface BoundKanbanProps {
  appId: string;
  binding: DataBinding;
  columnField: string;
  titleField: string;
  descriptionField?: string;
}

/**
 * Groups bound rows into kanban columns by the distinct values of
 * `columnField`. Distinct values are surfaced in row order so authors can
 * influence column order via their data.
 */
export function BoundKanban({
  appId,
  binding,
  columnField,
  titleField,
  descriptionField,
}: BoundKanbanProps) {
  const { rows, loading, error } = useBoundRows(appId, binding);

  const columns = useMemo<KanbanColumn[]>(() => {
    const map = new Map<string, KanbanColumn>();
    rows.forEach((row, index) => {
      const colName = String(row[columnField] ?? 'Uncategorized');
      if (!map.has(colName)) {
        map.set(colName, { id: colName, title: colName, items: [] });
      }
      map.get(colName)!.items.push({
        id: String(row.id ?? row.gab_id ?? `row-${index}`),
        title: String(row[titleField] ?? '—'),
        description:
          descriptionField && row[descriptionField] != null
            ? String(row[descriptionField])
            : undefined,
      });
    });
    return Array.from(map.values());
  }, [rows, columnField, titleField, descriptionField]);

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Text size="sm" color="muted">{error}</Text>
        </CardContent>
      </Card>
    );
  }

  if (columns.length === 0) {
    return <KanbanBoard columns={[{ id: 'empty', title: 'No data', items: [] }]} />;
  }

  return <KanbanBoard columns={columns} />;
}
