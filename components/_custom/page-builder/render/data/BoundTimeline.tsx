'use client';

import { useMemo } from 'react';
import { Timeline, type TimelineItem } from '@/components/ui/organisms';
import { Skeleton, Text } from '@/components/ui/atoms';
import { Card, CardContent } from '@/components/ui/molecules';
import type { DataBinding } from '@/lib/core/ports/pages.repository';
import { useBoundRows } from './useBoundRows';

export interface BoundTimelineProps {
  appId: string;
  binding: DataBinding;
  titleField: string;
  dateField: string;
  descriptionField?: string;
}

export function BoundTimeline({
  appId,
  binding,
  titleField,
  dateField,
  descriptionField,
}: BoundTimelineProps) {
  const { rows, loading, error } = useBoundRows(appId, binding);

  const items = useMemo<TimelineItem[]>(() => {
    return rows.map((row, index) => {
      const rawDate = row[dateField];
      let dateLabel = '';
      if (rawDate) {
        const d = new Date(String(rawDate));
        dateLabel = Number.isNaN(d.getTime()) ? String(rawDate) : d.toLocaleDateString();
      }
      return {
        id: String(row.id ?? row.gab_id ?? `row-${index}`),
        title: String(row[titleField] ?? '—'),
        date: dateLabel,
        description:
          descriptionField && row[descriptionField] != null
            ? String(row[descriptionField])
            : undefined,
      };
    });
  }, [rows, titleField, dateField, descriptionField]);

  if (loading) return <Skeleton className="h-32 w-full" />;
  if (error) {
    return (
      <Card>
        <CardContent>
          <Text size="sm" color="muted">{error}</Text>
        </CardContent>
      </Card>
    );
  }
  if (items.length === 0) {
    return <Timeline items={[{ id: 'empty', title: 'No events yet', date: '', description: '' }]} />;
  }
  return <Timeline items={items} />;
}
