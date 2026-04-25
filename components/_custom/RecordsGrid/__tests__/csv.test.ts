import { describe, expect, it } from 'vitest';
import { rowsToCsv, parseCsv } from '../csv';
import type { GabField } from '@/lib/core/ports/field.repository';

function field(partial: Partial<GabField> & { key: string; type: string; name: string }): GabField {
  return {
    id: partial.key,
    appId: 'app',
    tableId: 'tbl',
    sortOrder: 0,
    required: false,
    isSystem: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    config: null,
    formula: null,
    lookupConfig: null,
    summaryConfig: null,
    ...partial,
  } as GabField;
}

describe('rowsToCsv', () => {
  it('emits headers from non-system fields and quotes risky values', () => {
    const fields = [
      field({ key: 'name', name: 'Name', type: 'text' }),
      field({ key: 'note', name: 'Note', type: 'text' }),
      field({ key: 'isSystemField', name: 'Sys', type: 'text', isSystem: true }),
    ];
    const rows = [
      { name: 'Alice', note: 'Says "hi"', isSystemField: 'ignored' },
      { name: 'Bob', note: 'Has, comma\nand newline', isSystemField: 'ignored' },
    ];

    const csv = rowsToCsv(fields, rows);

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const [header, line1, line2] = csv.slice(1).split('\r\n');
    expect(header).toBe('Name,Note');
    expect(line1).toBe('Alice,"Says ""hi"""');
    expect(line2).toBe('Bob,"Has, comma\nand newline"');
  });

  it('serialises booleans, numbers, and objects sensibly', () => {
    const fields = [
      field({ key: 'active', name: 'Active', type: 'boolean' }),
      field({ key: 'count', name: 'Count', type: 'number' }),
      field({ key: 'meta', name: 'Meta', type: 'json' }),
    ];

    const csv = rowsToCsv(fields, [
      { active: true, count: 42, meta: { tag: 'a' } },
    ]);

    expect(csv.slice(1).split('\r\n')[1]).toBe('true,42,"{""tag"":""a""}"');
  });
});

describe('parseCsv', () => {
  it('splits headers and rows, handling quoted fields and CRLF endings', () => {
    const input = 'name,note\r\n"Alice","Says ""hi"""\r\n"Bob","x,y"\r\n';
    const result = parseCsv(input);

    expect(result.headers).toEqual(['name', 'note']);
    expect(result.rows).toEqual([
      ['Alice', 'Says "hi"'],
      ['Bob', 'x,y'],
    ]);
  });

  it('strips a UTF-8 BOM if present', () => {
    const input = '\uFEFFname,age\nAlice,30';
    const result = parseCsv(input);

    expect(result.headers).toEqual(['name', 'age']);
    expect(result.rows).toEqual([['Alice', '30']]);
  });

  it('preserves embedded newlines inside quoted fields', () => {
    const input = 'name,note\nAlice,"line1\nline2"';
    const result = parseCsv(input);

    expect(result.rows[0][1]).toBe('line1\nline2');
  });

  it('returns empty headers and rows when input is blank', () => {
    expect(parseCsv('')).toEqual({ headers: [], rows: [] });
    expect(parseCsv('\n\n')).toEqual({ headers: [], rows: [] });
  });
});
