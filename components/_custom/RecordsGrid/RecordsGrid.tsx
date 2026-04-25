'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button, Heading, Text } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  DataTable,
  EmptyState,
  Pagination,
  SearchInput,
  Toolbar,
} from '@/components/ui/molecules';
import { Inbox, RefreshCw, AlertCircle, Download } from 'lucide-react';
import { fetchRowsAction } from '@/app/actions/data';
import { buildColumnsFromFields } from './columns';
import { rowsToCsv, triggerCsvDownload } from './csv';
import type {
  RecordsGridProps,
  RecordsGridFetcher,
  RecordsGridFetchResult,
} from './types';
import type { GabRow } from '@/lib/core/ports/data.repository';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * Default fetcher backed by the generic `fetchRowsAction`. Pages can pass a
 * `fetcher` prop to swap in a vertical-specific data source.
 */
const defaultFetcher: RecordsGridFetcher = async (params) => {
  const result = await fetchRowsAction({
    applicationKey: params.appId,
    tableKey: params.tableId,
    limit: params.pageSize,
    offset: (params.page - 1) * params.pageSize,
    search: params.search,
    filters: params.filters?.length
      ? Object.fromEntries(params.filters.map((f) => [f.field, f.value]))
      : undefined,
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch records');
  }

  return {
    rows: (result.data ?? []) as GabRow[],
    total: result.total ?? 0,
  };
};

/**
 * Server-driven records grid for a GAB Core table.
 *
 * - Server-side search / sort / pagination via Server Actions.
 * - URL-synced state (page, search, sort) so deep links and back-button
 *   navigation work as expected.
 * - Composed entirely from `@/components/ui/...` primitives.
 *
 * Phase 0 scaffold: filters, inline edit, and CSV import/export are added in
 * Phase 1; the API surface stays stable so callers don't break.
 */
export function RecordsGrid({
  appId,
  tableId,
  fields,
  visibleFieldKeys,
  fetcher,
  pageSize: initialPageSize = 25,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  selectable = true,
  bulkActions,
  onRowClick,
  syncToUrl = true,
  className,
  title,
  toolbarActions,
}: RecordsGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Prefix query params with the table id so multiple grids on one page do
  // not collide. `_p` (page), `_q` (search), `_s` (sort) are short on purpose.
  const paramPrefix = `g_${tableId}_`;
  const initialPage = syncToUrl ? Number(searchParams.get(`${paramPrefix}p`) ?? '1') : 1;
  const initialSearch = syncToUrl ? (searchParams.get(`${paramPrefix}q`) ?? '') : '';
  const initialSort = syncToUrl ? (searchParams.get(`${paramPrefix}s`) ?? '') : '';

  const [page, setPage] = useState(initialPage > 0 ? initialPage : 1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(
    parseSort(initialSort),
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rows, setRows] = useState<GabRow[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  const columns = useMemo(
    () => buildColumnsFromFields(fields, visibleFieldKeys),
    [fields, visibleFieldKeys],
  );

  const activeFetcher = fetcher ?? defaultFetcher;

  // Use a ref to track the latest request so older responses can be discarded
  // when the user types fast or clicks pages quickly.
  const requestSeq = useRef(0);

  const refresh = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const result: RecordsGridFetchResult = await activeFetcher({
        appId,
        tableId,
        page,
        pageSize,
        search: search || undefined,
        sortKey: sort?.key,
        sortDir: sort?.dir,
      });
      if (seq !== requestSeq.current) return;
      setRows(result.rows);
      setTotal(result.total);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      const message = err instanceof Error ? err.message : 'Failed to load records';
      setError(message);
      setRows([]);
      setTotal(0);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [activeFetcher, appId, tableId, page, pageSize, search, sort?.key, sort?.dir]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Mirror state into the URL (debounced via React transition so typing
  // doesn't queue a navigation per keystroke).
  useEffect(() => {
    if (!syncToUrl) return;
    startTransition(() => {
      const next = new URLSearchParams(searchParams.toString());
      writeOrDelete(next, `${paramPrefix}p`, page > 1 ? String(page) : '');
      writeOrDelete(next, `${paramPrefix}q`, search);
      writeOrDelete(next, `${paramPrefix}s`, sort ? `${sort.key}:${sort.dir}` : '');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }, [syncToUrl, page, search, sort, paramPrefix, pathname, router, searchParams]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleSort = useCallback((key: string, dir: 'asc' | 'desc' | null) => {
    setPage(1);
    setSort(dir ? { key, dir } : null);
  }, []);

  const handleSearchChange = useCallback((next: string) => {
    setPage(1);
    setSearch(next);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPage(1);
    setPageSize(size);
  }, []);

  const allRowIds = useMemo(
    () => rows.map((r, i) => extractRowId(r, i)),
    [rows],
  );
  const allSelected = allRowIds.length > 0 && allRowIds.every((id) => selectedIds.includes(id));
  const someSelected = allRowIds.some((id) => selectedIds.includes(id)) && !allSelected;

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !allRowIds.includes(id))
        : Array.from(new Set([...prev, ...allRowIds])),
    );
  }, [allSelected, allRowIds]);

  const toggleSelectRow = useCallback((rowId: string) => {
    setSelectedIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId],
    );
  }, []);

  return (
    <div className={className}>
      <Card>
        <CardContent className="p-4 space-y-4">
          <Toolbar
            leading={
              <div className="flex items-center gap-3">
                {title ? (
                  typeof title === 'string'
                    ? <Heading as="h3" className="text-base">{title}</Heading>
                    : title
                ) : null}
                <SearchInput
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search records..."
                  className="w-64"
                />
              </div>
            }
            actions={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const csv = rowsToCsv(fields, rows);
                    triggerCsvDownload(`${tableId}-records.csv`, csv);
                  }}
                  disabled={rows.length === 0}
                  aria-label="Export current page to CSV"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refresh()}
                  aria-label="Refresh"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Refresh
                </Button>
                {toolbarActions}
              </>
            }
          />

          {selectable && selectedIds.length > 0 && bulkActions && bulkActions.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded border border-primary/20 bg-primary-light">
              <Text size="sm" weight="medium">
                {selectedIds.length} selected
              </Text>
              <div className="ml-auto flex items-center gap-1.5">
                {bulkActions.map((action) => (
                  <Button
                    key={action.id}
                    size="sm"
                    variant={action.variant ?? 'outline'}
                    onClick={() =>
                      action.onClick(selectedIds.map((id) => Number(id)).filter((n) => !Number.isNaN(n)))
                    }
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {error ? (
            <EmptyState
              status="error"
              icon={AlertCircle}
              title="Could not load records"
              description={error}
              action={{ label: 'Try again', onClick: () => refresh() }}
            />
          ) : (
            <DataTable
              data={rows}
              columns={columns}
              keyExtractor={(row) => extractRowId(row, 0)}
              density="compact"
              onSort={handleSort}
              selectable={selectable}
              selectedRowIds={selectedIds}
              onSelectRow={toggleSelectRow}
              onSelectAll={toggleSelectAll}
              allSelected={allSelected}
              someSelected={someSelected}
              onRowClick={onRowClick}
              emptyState={
                <EmptyState
                  status="empty"
                  icon={Inbox}
                  title={loading ? 'Loading records…' : 'No records yet'}
                  description={
                    loading
                      ? undefined
                      : search
                        ? 'No records match your search.'
                        : 'Create the first record from the toolbar above.'
                  }
                />
              }
            />
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={total}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={pageSizeOptions}
            itemLabel="Record"
            isLoading={loading && rows.length === 0}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function extractRowId(row: GabRow, fallback: number): string {
  if (row && typeof row === 'object' && 'id' in row && row.id !== undefined && row.id !== null) {
    return String((row as { id: unknown }).id);
  }
  return String(fallback);
}

function parseSort(raw: string): { key: string; dir: 'asc' | 'desc' } | null {
  if (!raw) return null;
  const [key, dir] = raw.split(':');
  if (!key || (dir !== 'asc' && dir !== 'desc')) return null;
  return { key, dir };
}

function writeOrDelete(params: URLSearchParams, key: string, value: string) {
  if (value) params.set(key, value);
  else params.delete(key);
}

export default RecordsGrid;
