'use client';

import { useState, useMemo, useCallback, type ReactNode, type ElementType } from 'react';
import { DataTable, type Column } from '@/components/ui/molecules/DataTable';
import { SearchInput } from '@/components/ui/molecules/SearchInput';
import { Pagination } from '@/components/ui/molecules/Pagination';
import { Button, Skeleton } from '@/components/ui/atoms';
import { cn } from '@/lib/utils';

export interface BulkAction {
  label: string;
  icon?: ElementType;
  onClick: (selectedIds: string[]) => void;
  variant?: 'primary' | 'danger' | 'outline';
}

export interface DataGridProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  keyExtractor?: (row: T) => string;
  /** Show a search bar above the table. @default true */
  searchable?: boolean;
  /** Keys to match against when searching. Falls back to column keys. */
  searchKeys?: string[];
  /** @default 10 */
  pageSize?: number;
  /** Page size selector dropdown options */
  pageSizeOptions?: number[];
  /** Enable checkbox selection @default false */
  selectable?: boolean;
  /** Controlled selected row IDs */
  selectedRows?: string[];
  /** Called when selection changes */
  onSelectionChange?: (selectedIds: string[]) => void;
  /** Bulk action buttons shown when rows are selected */
  bulkActions?: BulkAction[];
  /** Show loading skeleton @default false */
  loading?: boolean;
  /** Custom empty state */
  emptyState?: ReactNode;
  /** Server-side sort callback. If provided, DataTable sort is disabled (parent handles it) */
  onSort?: (key: string, direction: 'asc' | 'desc' | null) => void;
  /** Sort on the full filtered dataset before pagination @default true */
  sortBeforePaginate?: boolean;
  /** Row density @default 'default' */
  density?: 'compact' | 'default' | 'comfortable';
  className?: string;
  title?: ReactNode;
}

/**
 * A high-level data grid that composes {@link DataTable}, {@link SearchInput},
 * and {@link Pagination} into a single searchable, sortable, paginated view.
 *
 * Now supports selection, bulk actions, loading states, page size options,
 * and density variants.
 */
export function DataGrid<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  searchable = true,
  searchKeys,
  pageSize: initialPageSize = 10,
  pageSizeOptions,
  selectable = false,
  selectedRows: controlledSelection,
  onSelectionChange,
  bulkActions,
  loading = false,
  emptyState,
  onSort,
  sortBeforePaginate = true,
  density = 'default',
  className,
  title,
}: DataGridProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [internalSelection, setInternalSelection] = useState<string[]>([]);

  const selectedIds = controlledSelection ?? internalSelection;
  const setSelectedIds = onSelectionChange ?? setInternalSelection;

  const filtered = useMemo(() => {
    if (!search) return data;
    const lower = search.toLowerCase();
    const keys = searchKeys || columns.map((c) => c.key);
    return data.filter((row) =>
      keys.some((key) => String(row[key] || '').toLowerCase().includes(lower)),
    );
  }, [data, search, searchKeys, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getRowId = useCallback((row: T, index: number) => {
    if (keyExtractor) return keyExtractor(row);
    if ('id' in row) return String(row.id);
    return String(index);
  }, [keyExtractor]);

  const allPageIds = paginated.map((row, i) => getRowId(row, (page - 1) * pageSize + i));
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.includes(id));
  const someSelected = allPageIds.some((id) => selectedIds.includes(id)) && !allSelected;

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(selectedIds.filter((id) => !allPageIds.includes(id)));
    } else {
      const merged = new Set([...selectedIds, ...allPageIds]);
      setSelectedIds(Array.from(merged));
    }
  }, [allSelected, allPageIds, selectedIds, setSelectedIds]);

  const handleSelectRow = useCallback((rowId: string) => {
    setSelectedIds(
      selectedIds.includes(rowId)
        ? selectedIds.filter((id) => id !== rowId)
        : [...selectedIds, rowId],
    );
  }, [selectedIds, setSelectedIds]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {(title || searchable) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {title && <Skeleton className="h-6 w-32" />}
            {searchable && <Skeleton className="h-9 w-64" />}
          </div>
        )}
        <div className="rounded border border-border overflow-hidden">
          <div className="bg-muted px-4 py-3">
            <Skeleton className="h-4 w-full" />
          </div>
          {Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-t border-border">
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {(title || searchable || (selectable && selectedIds.length > 0)) && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
            {searchable && <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} className="sm:w-64" />}
          </div>

          {selectable && selectedIds.length > 0 && bulkActions && (
            <div className="flex items-center gap-2 px-3 py-2 rounded border border-primary/20 bg-primary-light">
              <span className="text-sm text-foreground font-medium">{selectedIds.length} selected</span>
              <div className="flex items-center gap-1.5 ml-auto">
                {bulkActions.map((action) => {
                  const ActionIcon = action.icon;
                  return (
                    <Button
                      key={action.label}
                      variant={action.variant ?? 'outline'}
                      size="sm"
                      onClick={() => action.onClick(selectedIds)}
                    >
                      {ActionIcon && <ActionIcon className="h-3.5 w-3.5 mr-1" />}
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <DataTable
        data={sortBeforePaginate ? paginated : paginated}
        columns={columns}
        keyExtractor={keyExtractor}
        emptyMessage={emptyState ? undefined : 'No data'}
        emptyState={emptyState}
        density={density}
        onSort={onSort}
        sortFullData={sortBeforePaginate ? filtered : undefined}
        selectable={selectable}
        selectedRowIds={selectedIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        allSelected={allSelected}
        someSelected={someSelected}
      />

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Showing {paginated.length} of {filtered.length} results
        </p>
        <div className="flex items-center gap-3">
          {pageSizeOptions && pageSizeOptions.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
                aria-label="Rows per page"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          )}
          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      </div>
    </div>
  );
}

export default DataGrid;
