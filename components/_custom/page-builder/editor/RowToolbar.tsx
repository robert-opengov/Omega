'use client';

import { type ChangeEvent } from 'react';
import { Button, Label, Select } from '@/components/ui/atoms';
import { Trash2, Plus } from 'lucide-react';
import type { PageRow } from '@/lib/core/ports/pages.repository';

export interface RowToolbarProps {
  row: PageRow;
  index: number;
  rowCount: number;
  onUpdate: (patch: Partial<Omit<PageRow, 'id' | 'components'>>) => void;
  onDelete: () => void;
  onAddRowBelow: () => void;
}

const COL_OPTIONS = [1, 2, 3, 4, 6, 12];

/**
 * Per-row controls — rendered above each row in the canvas. Lets editors set
 * the column count for each breakpoint (lg / md / sm) and gap, plus add a
 * new row directly below.
 */
export function RowToolbar({
  row,
  index,
  rowCount,
  onUpdate,
  onDelete,
  onAddRowBelow,
}: RowToolbarProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground border-b border-dashed border-border/60 pb-1 mb-2 mt-2">
      <span className="font-mono">Row {index + 1}/{rowCount}</span>

      <Field label="lg cols">
        <Select
          value={String(row.columns)}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            onUpdate({ columns: Number(e.target.value) })
          }
          className="h-7 text-xs w-16"
        >
          {COL_OPTIONS.map((n) => (
            <option key={n} value={String(n)}>{n}</option>
          ))}
        </Select>
      </Field>
      <Field label="md cols">
        <Select
          value={String(row.columnsMd ?? row.columns)}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            onUpdate({ columnsMd: Number(e.target.value) })
          }
          className="h-7 text-xs w-16"
        >
          {COL_OPTIONS.map((n) => (
            <option key={n} value={String(n)}>{n}</option>
          ))}
        </Select>
      </Field>
      <Field label="sm cols">
        <Select
          value={String(row.columnsSm ?? 1)}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            onUpdate({ columnsSm: Number(e.target.value) })
          }
          className="h-7 text-xs w-16"
        >
          {COL_OPTIONS.filter((n) => n <= 4).map((n) => (
            <option key={n} value={String(n)}>{n}</option>
          ))}
        </Select>
      </Field>
      <Field label="gap">
        <Select
          value={String(row.gap ?? 16)}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            onUpdate({ gap: Number(e.target.value) })
          }
          className="h-7 text-xs w-16"
        >
          {[0, 4, 8, 12, 16, 24, 32].map((n) => (
            <option key={n} value={String(n)}>{n}</option>
          ))}
        </Select>
      </Field>

      <div className="ml-auto flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={onAddRowBelow}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add row
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-destructive"
          onClick={onDelete}
          disabled={rowCount <= 1}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Label className="text-[10px] uppercase tracking-wide">{label}</Label>
      {children}
    </span>
  );
}
