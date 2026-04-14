'use client';

import { useState, useMemo, type ReactNode } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  /** @default true */
  sortable?: boolean;
  className?: string;
}

type SortDir = 'asc' | 'desc' | null;

const densityStyles = {
  compact: { row: 'h-[36px]', cell: 'px-3 py-1.5', text: 'text-xs' },
  default: { row: 'h-[50px]', cell: 'px-4 py-3', text: 'text-sm' },
  comfortable: { row: 'h-[60px]', cell: 'px-4 py-4', text: 'text-sm' },
};

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor?: (row: T) => string;
  className?: string;
  /** @default 'No data' */
  emptyMessage?: string;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  /** @default 'Data table' */
  tableLabel?: string;
  /** Row density @default 'default' */
  density?: 'compact' | 'default' | 'comfortable';
  /** Server-side sort callback. When provided, internal sort is skipped. */
  onSort?: (key: string, direction: 'asc' | 'desc' | null) => void;
  /**
   * When provided, sorting happens on this full dataset (used by DataGrid
   * to sort before pagination). Internal sort still works on `data` if
   * this is not provided.
   */
  sortFullData?: T[];
  /** Enable row selection checkboxes */
  selectable?: boolean;
  selectedRowIds?: string[];
  onSelectRow?: (rowId: string) => void;
  onSelectAll?: () => void;
  allSelected?: boolean;
  someSelected?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  className,
  emptyMessage = 'No data',
  emptyState,
  onRowClick,
  tableLabel = 'Data table',
  density = 'default',
  onSort,
  sortFullData,
  selectable = false,
  selectedRowIds = [],
  onSelectRow,
  onSelectAll,
  allSelected = false,
  someSelected = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const styles = densityStyles[density];

  const handleSort = (key: string) => {
    let newDir: SortDir;
    if (sortKey === key) {
      newDir = sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc';
      if (newDir === null) setSortKey(null);
    } else {
      setSortKey(key);
      newDir = 'asc';
    }
    setSortDir(newDir);

    if (onSort) {
      onSort(key, newDir);
    }
  };

  const sorted = useMemo(() => {
    if (onSort) return data;
    if (!sortKey || !sortDir) return data;

    const sourceData = sortFullData ?? data;
    return [...sourceData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortFullData, sortKey, sortDir, onSort]);

  const getRowId = (row: T, index: number) => {
    if (keyExtractor) return keyExtractor(row);
    if ('id' in row) return String(row.id);
    return String(index);
  };

  const totalColumns = columns.length + (selectable ? 1 : 0);

  return (
    <div className={cn('overflow-x-auto rounded border border-border', className)}>
      <table className={cn('w-full', styles.text)} aria-label={tableLabel}>
        <thead>
          <tr className="border-b border-border bg-muted">
            {selectable && (
              <th className={cn(styles.cell, 'w-10')}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={onSelectAll}
                  className="accent-primary h-4 w-4 rounded"
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(styles.cell, 'text-left font-medium text-muted-foreground', col.className)}
                aria-sort={
                  col.sortable !== false
                    ? (sortKey === col.key && sortDir === 'asc' ? 'ascending' : sortKey === col.key && sortDir === 'desc' ? 'descending' : 'none')
                    : undefined
                }
              >
                {col.sortable !== false ? (
                  <button
                    onClick={() => handleSort(col.key)}
                    aria-label={`Sort by ${col.header}`}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-all duration-200 ease-in-out"
                  >
                    {col.header}
                    {sortKey === col.key && sortDir === 'asc' ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : sortKey === col.key && sortDir === 'desc' ? (
                      <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={totalColumns} className={cn(styles.cell, 'py-8 text-center text-muted-foreground')}>
                {emptyState ?? emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => {
              const rowId = getRowId(row, i);
              const isSelected = selectedRowIds.includes(rowId);
              return (
                <tr
                  key={rowId}
                  onClick={() => onRowClick?.(row)}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick?.(row); } }
                      : undefined
                  }
                  className={cn(
                    'border-b border-border last:border-0 transition-all duration-200 ease-in-out',
                    styles.row,
                    onRowClick && 'cursor-pointer hover:bg-action-hover-primary',
                    isSelected && 'bg-primary-light',
                  )}
                >
                  {selectable && (
                    <td className={cn(styles.cell, 'w-10')} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectRow?.(rowId)}
                        className="accent-primary h-4 w-4 rounded"
                        aria-label={`Select row ${rowId}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={cn(styles.cell, 'text-foreground', col.className)}>
                      {col.render ? col.render(row) : (row[col.key] as ReactNode)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
