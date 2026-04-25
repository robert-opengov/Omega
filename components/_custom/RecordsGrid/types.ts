/**
 * Shared types for the RecordsGrid family of components.
 *
 * RecordsGrid is fork-level shared chrome around a GAB Core records table:
 * server-side fetch, search, sort, paginate, select, optionally inline-edit.
 *
 * It composes only from `@/components/ui/...` primitives — no external
 * grid libraries — so it stays portable across forks.
 */

import type { GabField } from '@/lib/core/ports/field.repository';
import type { GabRow } from '@/lib/core/ports/data.repository';

export interface RecordsGridFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface RecordsGridFetchParams {
  appId: string;
  tableId: string;
  page: number;
  pageSize: number;
  search?: string;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  filters?: RecordsGridFilter[];
}

export interface RecordsGridFetchResult {
  rows: GabRow[];
  total: number;
}

/**
 * Adapter shape for fetching rows. Defaults to a server action that calls
 * `gabDataRepo.fetchRows`, but pages can pass a custom fetcher (for e.g.
 * vertical-specific repos with extra filtering rules).
 */
export type RecordsGridFetcher = (
  params: RecordsGridFetchParams,
) => Promise<RecordsGridFetchResult>;

export interface RecordsGridBulkAction {
  id: string;
  label: string;
  variant?: 'primary' | 'outline' | 'danger';
  onClick: (selectedRowIds: number[]) => void | Promise<void>;
}

export interface RecordsGridProps {
  appId: string;
  tableId: string;
  /** Field metadata used to render columns. The grid renders all non-system fields by default. */
  fields: GabField[];
  /** Override which field keys to render. Defaults to every non-system field in order. */
  visibleFieldKeys?: string[];
  /** Optional override for the data fetcher (defaults to fetchRowsAction). */
  fetcher?: RecordsGridFetcher;
  /** Initial page size. @default 25 */
  pageSize?: number;
  /** Allowed page size options. @default [10, 25, 50, 100] */
  pageSizeOptions?: number[];
  /** When true, show a checkbox column and bulk action toolbar. @default true */
  selectable?: boolean;
  /** Action buttons rendered when one or more rows are selected. */
  bulkActions?: RecordsGridBulkAction[];
  /** Optional row click handler — usually opens a record drawer. */
  onRowClick?: (row: GabRow) => void;
  /** Persist page/search/sort to URL search params. @default true */
  syncToUrl?: boolean;
  className?: string;
  /** Heading rendered above the toolbar. */
  title?: React.ReactNode;
  /** Right-aligned content in the toolbar (e.g. "New Record" button). */
  toolbarActions?: React.ReactNode;
}
