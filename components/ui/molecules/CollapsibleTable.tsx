'use client';

import { useState, type ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CollapsibleTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

export interface CollapsibleTableExtraColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render: (row: CollapsibleTableRow, index: number) => ReactNode;
}

export interface CollapsibleTableRow {
  cells: Record<string, string | number | ReactNode>;
  /** Optional alert indicator for the row */
  alert?: { icon?: ReactNode; className?: string };
}

export interface CollapsibleTableProps {
  title: ReactNode;
  columns: CollapsibleTableColumn[];
  rows: CollapsibleTableRow[];
  /** Additional columns with custom renderers (e.g. confidence, status) */
  extraColumns?: CollapsibleTableExtraColumn[];
  /** Whether the section starts expanded. @default true */
  defaultOpen?: boolean;
  className?: string;
}

export function CollapsibleTable({ title, columns, rows, extraColumns, defaultOpen = true, className }: CollapsibleTableProps) {
  const [open, setOpen] = useState(defaultOpen);

  const allColumns = [
    ...columns,
    ...(extraColumns ?? []).map((ec) => ({ key: ec.key, label: ec.label, align: ec.align })),
  ];

  return (
    <div className={cn('border border-border rounded overflow-hidden', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-foreground hover:bg-action-hover transition-colors duration-200"
        aria-expanded={open}
      >
        <span>{title}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

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
                  className={cn('border-t border-border', row.alert?.className)}
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
                        {row.alert && ci === 0 && row.alert.icon}
                        {row.cells[col.key]}
                      </span>
                    </td>
                  ))}
                  {extraColumns?.map((ec) => (
                    <td
                      key={ec.key}
                      className={cn(
                        'px-4 py-2',
                        ec.align === 'right' && 'text-right',
                        ec.align === 'center' && 'text-center',
                      )}
                    >
                      {ec.render(row, i)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CollapsibleTable;
