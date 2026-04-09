'use client';

import { useState, useMemo } from 'react';
import { DataTable, type Column } from '@/components/ui/molecules/DataTable';
import { SearchInput } from '@/components/ui/molecules/SearchInput';
import { Pagination } from '@/components/ui/molecules/Pagination';
import { cn } from '@/lib/utils';

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
  className?: string;
  title?: string;
}

/**
 * A high-level data grid that composes {@link DataTable}, {@link SearchInput},
 * and {@link Pagination} into a single searchable, paginated view.
 *
 * @example
 * <DataGrid data={users} columns={columns} title="Users" />
 */
export function DataGrid<T extends Record<string, unknown>>({
  data, columns, keyExtractor, searchable = true, searchKeys, pageSize = 10, className, title,
}: DataGridProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search) return data;
    const lower = search.toLowerCase();
    const keys = searchKeys || columns.map((c) => c.key);
    return data.filter((row) =>
      keys.some((key) => String(row[key] || '').toLowerCase().includes(lower))
    );
  }, [data, search, searchKeys, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className={cn('space-y-4', className)}>
      {(title || searchable) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
          {searchable && <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} className="sm:w-64" />}
        </div>
      )}
      <DataTable data={paginated} columns={columns} keyExtractor={keyExtractor} />
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
      <p className="text-xs text-muted-foreground text-center">
        Showing {paginated.length} of {filtered.length} results
      </p>
    </div>
  );
}

export default DataGrid;
