'use client';

import { RecordsGrid } from '@/components/_custom/RecordsGrid';
import type { GabField } from '@/lib/core/ports/field.repository';
import { ViewerEmptyState } from './EmptyState';

export interface DataTableReportViewerProps {
  appId: string;
  appKey: string;
  tableId?: string;
  tableKey?: string;
  fields: GabField[];
}

/**
 * Read-only datatable viewer. Reuses the existing `RecordsGrid` (Phase 1)
 * with editing and bulk actions disabled so the report stays purely
 * presentational.
 */
export function DataTableReportViewer({
  appId,
  appKey,
  tableId,
  tableKey,
  fields,
}: Readonly<DataTableReportViewerProps>) {
  if (!tableId || !tableKey) {
    return (
      <ViewerEmptyState
        title="Select a source table"
        description="Pick a table from the toolbar to load its records into this report."
      />
    );
  }

  return (
    <RecordsGrid
      appId={appId}
      tableId={tableId}
      applicationKey={appKey}
      tableKey={tableKey}
      fields={fields}
      editable={false}
      enableMutations={false}
      selectable={false}
      syncToUrl={false}
    />
  );
}
