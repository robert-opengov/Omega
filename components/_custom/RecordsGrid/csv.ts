import type { GabField } from '@/lib/core/ports/field.repository';
import type { GabRow } from '@/lib/core/ports/data.repository';

/**
 * Serialise a single value into a CSV-safe cell. Handles primitives, arrays,
 * dates, and JSON objects. Quotes are escaped per RFC 4180.
 */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(cellToString).join('; ');
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function escapeCsvField(value: string): string {
  if (value === '') return '';
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert a list of rows + field metadata to a CSV string. Field display name
 * is used as the header; `field.key` is the lookup into each row.
 *
 * Uses a UTF-8 BOM prefix so Excel opens unicode cleanly.
 */
export function rowsToCsv(fields: GabField[], rows: GabRow[]): string {
  const exportable = fields.filter((f) => !f.isSystem || f.key === 'id');
  const headers = exportable.map((f) => escapeCsvField(f.name));
  const lines: string[] = [headers.join(',')];

  for (const row of rows) {
    const cells = exportable.map((f) => {
      const raw = (row as Record<string, unknown>)[f.key];
      return escapeCsvField(cellToString(raw));
    });
    lines.push(cells.join(','));
  }

  return '\ufeff' + lines.join('\r\n');
}

export function triggerCsvDownload(filename: string, csv: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
