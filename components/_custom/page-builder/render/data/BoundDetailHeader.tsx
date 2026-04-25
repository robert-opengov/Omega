'use client';

import { useState } from 'react';
import { DetailPageHeader } from '@/components/ui/organisms';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/molecules';
import { Skeleton, Text } from '@/components/ui/atoms';
import type { DataBinding } from '@/lib/core/ports/pages.repository';
import { useBoundRecord } from './useBoundRows';
import { usePageSelection } from '../../runtime/PageContexts';

export interface BoundDetailHeaderProps {
  appId: string;
  binding?: DataBinding;
  staticTitle: string;
  /** Field name on the bound record to use as the heading. */
  titleField?: string;
  /** Field name on the bound record to use as the subtitle. */
  descriptionField?: string;
  /** Comma-separated list of fields to surface as metadata badges. */
  metadataFields?: string;
}

/**
 * Detail header bound to a single record. The record can be picked from the
 * binding's `recordId`, the page-wide selection (`PageSelectionContext`), or
 * the first row of the binding when neither is set.
 */
export function BoundDetailHeader({
  appId,
  binding,
  staticTitle,
  titleField = 'name',
  descriptionField,
  metadataFields,
}: BoundDetailHeaderProps) {
  const tableKey = binding?.source === 'table' || binding?.source === 'record'
    ? binding.tableKey
    : undefined;

  const { selection } = usePageSelection();
  const selected = tableKey ? selection[tableKey] : null;

  // If a row is selected from a sibling table, prefer that record id over the
  // binding default.
  const effectiveBinding: DataBinding | undefined =
    binding && selected
      ? { ...binding, recordId: selected.recordId }
      : binding;

  const bound = !!effectiveBinding && effectiveBinding.source !== 'static';
  const { record, loading, error } = useBoundRecord(appId, bound ? effectiveBinding : undefined);
  const [activeTab, setActiveTab] = useState('overview');

  if (!bound) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{staticTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <Text size="sm" color="muted">
            Bind this header to a record (use the data panel) or pair it with a
            data table on the same page to react to row selection.
          </Text>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (error || !record) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{staticTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <Text size="sm" color="muted">{error ?? 'No matching record.'}</Text>
        </CardContent>
      </Card>
    );
  }

  const fields = (metadataFields ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <DetailPageHeader
      breadcrumbs={[]}
      title={String(record[titleField] ?? staticTitle)}
      description={
        descriptionField && record[descriptionField] != null
          ? String(record[descriptionField])
          : undefined
      }
      metadata={fields.map((f) => ({
        label: humanize(f),
        value: record[f] == null ? '—' : String(record[f]),
      }))}
      tabs={[{ label: 'Overview', value: 'overview' }]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
}

function humanize(s: string): string {
  return s
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
