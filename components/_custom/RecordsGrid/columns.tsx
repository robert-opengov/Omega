'use client';

import type { ReactNode } from 'react';
import type { Column } from '@/components/ui/molecules/DataTable';
import type { GabField } from '@/lib/core/ports/field.repository';
import type { GabRow } from '@/lib/core/ports/data.repository';
import { Badge } from '@/components/ui/atoms';
import { EditableCell } from './EditableCell';

/**
 * Per-type cell formatters. The list intentionally covers the most common
 * GAB Core field types; anything unmapped falls through to a string cast.
 */
function renderCell(field: GabField, value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') return <span className="text-muted-foreground">—</span>;

  switch (field.type) {
    case 'boolean':
    case 'checkbox':
      return value ? <Badge variant="success" size="sm">true</Badge> : <Badge variant="default" size="sm">false</Badge>;
    case 'date':
    case 'datetime':
    case 'timestamp': {
      const d = new Date(String(value));
      return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
    }
    case 'number':
    case 'integer':
    case 'decimal':
    case 'currency': {
      const n = Number(value);
      return Number.isNaN(n) ? String(value) : n.toLocaleString();
    }
    case 'choice':
    case 'select':
      return <Badge variant="default" size="sm">{String(value)}</Badge>;
    case 'json':
    case 'object':
      return (
        <code className="text-xs text-muted-foreground break-all">
          {JSON.stringify(value)}
        </code>
      );
    default:
      return <span className="break-all">{String(value)}</span>;
  }
}

export function isEditable(field: GabField): boolean {
  if (field.isSystem) return false;
  if (field.formula) return false;
  if (field.lookupConfig) return false;
  if (field.summaryConfig) return false;
  return true;
}

export interface BuildColumnsOptions {
  visibleKeys?: string[];
  /** Enable inline editing. When provided, `onCellCommit` receives the change. */
  editable?: boolean;
  /**
   * Commit a single cell change. Receives the row, field, and parsed value.
   * Should throw on failure so the editor can surface the message.
   */
  onCellCommit?: (row: GabRow, field: GabField, next: unknown) => Promise<void>;
}

/**
 * Build {@link Column} definitions for {@link DataTable} from GAB field metadata.
 * Sorting is left enabled — the grid wires `onSort` to a server-side request.
 */
export function buildColumnsFromFields(
  fields: GabField[],
  options: BuildColumnsOptions | string[] = {},
): Column<GabRow>[] {
  // Backwards-compat: if the caller passed a `visibleKeys` array directly,
  // normalise it into the new options shape.
  const opts: BuildColumnsOptions = Array.isArray(options) ? { visibleKeys: options } : options;

  const ordered = [...fields].sort((a, b) => a.sortOrder - b.sortOrder);
  const filtered = opts.visibleKeys
    ? ordered.filter((f) => opts.visibleKeys!.includes(f.key))
    : ordered.filter((f) => !f.isSystem);

  return filtered.map((field) => ({
    key: field.key,
    header: field.name,
    sortable: true,
    render: (row) => {
      const display = renderCell(field, row[field.key]);
      if (!opts.editable || !opts.onCellCommit || !isEditable(field)) {
        return display;
      }
      return (
        <EditableCell
          field={field}
          value={row[field.key]}
          renderDisplay={(v) => renderCell(field, v)}
          onCommit={async (next) => {
            await opts.onCellCommit!(row, field, next);
          }}
        />
      );
    },
  }));
}
