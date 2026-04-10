'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/atoms/Badge';
import { cn } from '@/lib/utils';

export interface ReviewTableColumn {
  /** Unique key matching the cell data map. */
  key: string;
  /** Column header label. */
  label: string;
  /** Text alignment. @default 'left' */
  align?: 'left' | 'center' | 'right';
}

export interface ReviewTableRow {
  /** Map of column key -> cell value (string or number). */
  cells: Record<string, string | number>;
  /** When true, renders the row with a warning icon and amber text. */
  warning?: boolean;
  /**
   * Optional confidence percentage (0-100) shown as a Badge chip.
   * Renders in the last column position. >= 90 = success, < 90 = warning.
   */
  confidence?: number;
}

export interface ReviewTableProps {
  /** Section title displayed in the collapsible header. */
  title: string;
  /** Column definitions. */
  columns: ReviewTableColumn[];
  /** Row data. */
  rows: ReviewTableRow[];
  /** Whether the section starts expanded. @default true */
  defaultOpen?: boolean;
  className?: string;
}

/**
 * A collapsible data review section for wizard confirmation steps.
 *
 * Renders a titled, accordion-like panel containing a table with optional
 * warning rows (amber highlight) and AI confidence Badge chips.
 *
 * @example
 * <ReviewTable
 *   title="Award Details"
 *   columns={[{ key: 'category', label: 'Category' }, { key: 'value', label: 'Value' }]}
 *   rows={[{ cells: { category: 'Award Name', value: 'CDBG' } }]}
 * />
 */
export function ReviewTable({ title, columns, rows, defaultOpen = true, className }: ReviewTableProps) {
  const [open, setOpen] = useState(defaultOpen);

  const hasConfidence = rows.some((r) => r.confidence != null);
  const allColumns = hasConfidence
    ? [...columns, { key: '__confidence', label: 'AI Confidence', align: 'center' as const }]
    : columns;

  return (
    <div className={cn('border border-border rounded overflow-hidden', className)}>
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-foreground hover:bg-action-hover transition-colors duration-200"
        aria-expanded={open}
      >
        <span>{title}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {/* Table body */}
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-border">
                {allColumns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-2 font-semibold text-foreground whitespace-nowrap',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      !col.align && 'text-left',
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    'border-t border-border',
                    row.warning && 'text-warning-text',
                  )}
                >
                  {columns.map((col, ci) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-2 whitespace-nowrap',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {row.warning && ci === 0 && (
                          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                        )}
                        {row.cells[col.key]}
                      </span>
                    </td>
                  ))}
                  {hasConfidence && (
                    <td className="px-4 py-2 text-center">
                      {row.confidence != null && (
                        <Badge
                          variant={row.confidence >= 90 ? 'success' : 'warning'}
                          size="sm"
                          shape="boxy"
                        >
                          {row.confidence}%
                        </Badge>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ReviewTable;
