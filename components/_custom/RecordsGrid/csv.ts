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

/**
 * Parse a CSV string into a header row + records. Supports RFC 4180 quoting,
 * embedded newlines inside quoted fields, and `""` escaping. Strips a leading
 * UTF-8 BOM if present. Empty trailing lines are ignored.
 */
export function parseCsv(input: string): { headers: string[]; rows: string[][] } {
  let text = input;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const records: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }

    if (ch === '\r') {
      if (text[i + 1] === '\n') i++;
      row.push(field);
      records.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }

    if (ch === '\n') {
      row.push(field);
      records.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }

    field += ch;
    i++;
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    records.push(row);
  }

  const cleaned = records.filter((r) => !(r.length === 1 && r[0] === ''));
  if (cleaned.length === 0) return { headers: [], rows: [] };

  const [headers, ...rows] = cleaned;
  return { headers, rows };
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
