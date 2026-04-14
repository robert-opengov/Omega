'use client';

import { useState, useMemo, type ReactNode } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  /** The key of the data object to access the value. */
  key: string;
  /** The text to display in the column header. */
  header: string;
  /** Optional custom render function for the cell. */
  render?: (row: T) => ReactNode;
  /** Whether the column can be sorted. @default true */
  sortable?: boolean;
  /** Optional CSS classes for the header and cells. */
  className?: string;
}

export interface DataTableProps<T> {
  /** Array of data objects to display. */
  data: T[];
  /** Array of column configurations. */
  columns: Column<T>[];
  /** Extract a unique key for each row. Falls back to index. */
  keyExtractor?: (row: T) => string;
  className?: string;
  /** @default 'No data' */
  emptyMessage?: string;
  /** Callback fired when a row is clicked. */
  onRowClick?: (row: T) => void;
  /** @default 'Data table' */
  tableLabel?: string;
}

type SortDir = 'asc' | 'desc' | null;

/**
 * A sortable data table with CDS-37-aligned row heights and cold-shadow
 * border styling.
 *
 * Default row height is 50 px (`py-3` + text) to match CDS-37 table pattern.
 * Header uses `bg-muted` background with `font-medium` text.
 *
 * @example
 * <DataTable
 *   data={[{ id: 1, name: 'John' }]}
 *   columns={[{ key: 'id', header: 'ID' }, { key: 'name', header: 'Name' }]}
 * />
 *
 * @example
 * <DataTable data={users} columns={columns} />
 */
export function DataTable<T extends Record<string, unknown>>({
  data, columns, keyExtractor, className, emptyMessage = 'No data', onRowClick, tableLabel = 'Data table',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  return (
    <div className={cn('overflow-x-auto rounded border border-border', className)}>
      <table className="w-full text-sm" aria-label={tableLabel}>
        <thead>
          <tr className="border-b border-border bg-muted">
            {columns.map((col) => (
              <th key={col.key} className={cn('px-4 py-3 text-left font-medium text-muted-foreground', col.className)} aria-sort={col.sortable !== false ? (sortKey === col.key && sortDir === 'asc' ? 'ascending' : sortKey === col.key && sortDir === 'desc' ? 'descending' : 'none') : undefined}>
                {col.sortable !== false ? (
                  <button onClick={() => handleSort(col.key)} aria-label={`Sort by ${col.header}${sortKey === col.key ? (sortDir === 'asc' ? ', sorted ascending' : sortDir === 'desc' ? ', sorted descending' : '') : ''}`} className="inline-flex items-center gap-1 hover:text-foreground transition-all duration-200 ease-in-out">
                    {col.header}
                    {sortKey === col.key && sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : sortKey === col.key && sortDir === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                  </button>
                ) : col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">{emptyMessage}</td></tr>
          ) : (
            sorted.map((row, i) => (
              <tr
                key={keyExtractor ? keyExtractor(row) : i}
                onClick={() => onRowClick?.(row)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick?.(row); } } : undefined}
                className={cn('border-b border-border last:border-0 transition-all duration-200 ease-in-out h-[50px]', onRowClick && 'cursor-pointer hover:bg-action-hover-primary')}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 text-foreground', col.className)}>
                    {col.render ? col.render(row) : (row[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
