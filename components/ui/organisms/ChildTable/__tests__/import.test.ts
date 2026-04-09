import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChildTableImport } from '../hooks/useChildTableImport';
import type { ChildTableColumn } from '../core/models';

type Row = Record<string, unknown>;

const tableColumns: ChildTableColumn[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'amount', label: 'Amount', type: 'number' },
  { key: 'email', label: 'Email', type: 'email' },
];

function createCSVFile(content: string): File {
  return new File([content], 'test.csv', { type: 'text/csv' });
}

describe('useChildTableImport', () => {
  describe('parseCSV', () => {
    it('parses simple CSV', async () => {
      const { result } = renderHook(() => useChildTableImport<Row>());
      const file = createCSVFile('Name,Amount\nAlice,100\nBob,200');

      let parsed: Awaited<ReturnType<typeof result.current.parseCSV>>;
      await act(async () => {
        parsed = await result.current.parseCSV(file);
      });

      expect(parsed!.headers).toEqual(['Name', 'Amount']);
      expect(parsed!.rows).toHaveLength(2);
      expect(parsed!.rows[0]).toEqual(['Alice', '100']);
    });

    it('handles TSV (tab-separated)', async () => {
      const { result } = renderHook(() => useChildTableImport<Row>());
      const file = createCSVFile('Name\tAmount\nAlice\t100');

      let parsed: Awaited<ReturnType<typeof result.current.parseCSV>>;
      await act(async () => {
        parsed = await result.current.parseCSV(file);
      });

      expect(parsed!.headers).toEqual(['Name', 'Amount']);
      expect(parsed!.rows[0]).toEqual(['Alice', '100']);
    });

    it('handles quoted fields with commas (RFC 4180)', async () => {
      const { result } = renderHook(() => useChildTableImport<Row>());
      const file = createCSVFile('Name,Description\n"Smith, John","Has a comma"');

      let parsed: Awaited<ReturnType<typeof result.current.parseCSV>>;
      await act(async () => {
        parsed = await result.current.parseCSV(file);
      });

      expect(parsed!.rows[0][0]).toBe('Smith, John');
      expect(parsed!.rows[0][1]).toBe('Has a comma');
    });

    it('handles escaped double quotes (RFC 4180)', async () => {
      const { result } = renderHook(() => useChildTableImport<Row>());
      const file = createCSVFile('Name\n"She said ""hello"""');

      let parsed: Awaited<ReturnType<typeof result.current.parseCSV>>;
      await act(async () => {
        parsed = await result.current.parseCSV(file);
      });

      expect(parsed!.rows[0][0]).toBe('She said "hello"');
    });

    it('handles empty file', async () => {
      const { result } = renderHook(() => useChildTableImport<Row>());
      const file = createCSVFile('');

      let parsed: Awaited<ReturnType<typeof result.current.parseCSV>>;
      await act(async () => {
        parsed = await result.current.parseCSV(file);
      });

      expect(parsed!.headers).toEqual([]);
      expect(parsed!.rows).toHaveLength(0);
    });

    it('updates importProgress during parsing', async () => {
      const { result } = renderHook(() => useChildTableImport<Row>());
      const file = createCSVFile('A\n1\n2\n3');

      await act(async () => {
        await result.current.parseCSV(file);
      });

      expect(result.current.importProgress).not.toBeNull();
      expect(result.current.importProgress?.phase).toBe('complete');
      expect(result.current.importProgress?.current).toBe(3);
    });
  });

  describe('validateImportData', () => {
    const columnsWithRequired: ChildTableColumn[] = [
      {
        key: 'name',
        label: 'Name',
        type: 'text',
        validation: [{ type: 'required', message: '"Name" is required' }],
      },
      { key: 'amount', label: 'Amount', type: 'number' },
    ];

    it('passes valid data', () => {
      const { result } = renderHook(() => useChildTableImport<Row>());
      let validation: ReturnType<typeof result.current.validateImportData>;

      act(() => {
        validation = result.current.validateImportData(
          [['Alice', '100'], ['Bob', '200']],
          columnsWithRequired,
        );
      });

      expect(validation!.valid).toBe(true);
      expect(validation!.errors).toHaveLength(0);
      expect(validation!.coercedRows).toHaveLength(2);
    });

    it('catches missing required fields', () => {
      const { result } = renderHook(() => useChildTableImport<Row>());
      let validation: ReturnType<typeof result.current.validateImportData>;

      act(() => {
        validation = result.current.validateImportData(
          [['', '100']],
          columnsWithRequired,
        );
      });

      expect(validation!.valid).toBe(false);
      expect(validation!.errors).toHaveLength(1);
      expect(validation!.errors[0].column).toBe('Name');
    });

    it('catches type coercion errors', () => {
      const { result } = renderHook(() => useChildTableImport<Row>());
      let validation: ReturnType<typeof result.current.validateImportData>;

      act(() => {
        validation = result.current.validateImportData(
          [['Alice', 'not-a-number']],
          columnsWithRequired,
        );
      });

      expect(validation!.valid).toBe(false);
      expect(validation!.errors.length).toBeGreaterThanOrEqual(1);
    });

    it('detects duplicate values in unique columns', () => {
      const { result } = renderHook(() => useChildTableImport<Row>());
      const uniqueCols: ChildTableColumn[] = [
        { key: 'code', label: 'Code', type: 'text', isUnique: true },
      ];

      let validation: ReturnType<typeof result.current.validateImportData>;
      act(() => {
        validation = result.current.validateImportData(
          [['ABC'], ['ABC']],
          uniqueCols,
        );
      });

      expect(validation!.valid).toBe(false);
      expect(validation!.errors.some((e) => e.message.includes('Duplicate'))).toBe(true);
    });
  });

  describe('mapColumnsToFields', () => {
    it('matches exact column names', () => {
      const { result } = renderHook(() => useChildTableImport<Row>());
      let mappings: ReturnType<typeof result.current.mapColumnsToFields>;

      act(() => {
        mappings = result.current.mapColumnsToFields(
          ['Name', 'Amount', 'Email'],
          tableColumns,
        );
      });

      expect(mappings![0].tableColumn).toBe('name');
      expect(mappings![0].confidence).toBe(1);
      expect(mappings![1].tableColumn).toBe('amount');
      expect(mappings![2].tableColumn).toBe('email');
    });

    it('matches case-insensitive', () => {
      const { result } = renderHook(() => useChildTableImport<Row>());
      let mappings: ReturnType<typeof result.current.mapColumnsToFields>;

      act(() => {
        mappings = result.current.mapColumnsToFields(
          ['name', 'AMOUNT'],
          tableColumns,
        );
      });

      expect(mappings![0].tableColumn).toBe('name');
      expect(mappings![1].tableColumn).toBe('amount');
    });

    it('uses fuzzy matching for similar names', () => {
      const { result } = renderHook(() => useChildTableImport<Row>());
      let mappings: ReturnType<typeof result.current.mapColumnsToFields>;

      act(() => {
        mappings = result.current.mapColumnsToFields(
          ['Full Name', 'Total Amount'],
          tableColumns,
        );
      });

      expect(mappings![0].tableColumn).toBe('name');
      expect(mappings![0].confidence).toBeGreaterThan(0);
    });

    it('returns null tableColumn for unmatched headers', () => {
      const { result } = renderHook(() => useChildTableImport<Row>());
      let mappings: ReturnType<typeof result.current.mapColumnsToFields>;

      act(() => {
        mappings = result.current.mapColumnsToFields(
          ['zzz_no_match_zzz'],
          tableColumns,
        );
      });

      expect(mappings![0].tableColumn).toBeNull();
    });
  });

  describe('downloadCSV', () => {
    it('runs without error', () => {
      const { result } = renderHook(() => useChildTableImport<Row>());
      const rows = [
        { name: 'Alice', amount: 100 },
        { name: 'Bob', amount: 200 },
      ];

      expect(() => {
        act(() => {
          result.current.downloadCSV(tableColumns, rows, 'export');
        });
      }).not.toThrow();
    });
  });

  describe('cancelImport', () => {
    it('provides a cancelImport function', () => {
      const { result } = renderHook(() => useChildTableImport<Row>());
      expect(typeof result.current.cancelImport).toBe('function');
      expect(() => act(() => { result.current.cancelImport(); })).not.toThrow();
    });
  });
});
