'use client';

import { useCallback, useRef, useState } from 'react';

import type { ChildTableColumn } from '../core/models';
import { coerceValue } from '../core/validators';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImportProgress {
  phase: 'parsing' | 'validating' | 'mapping' | 'complete' | 'error';
  current: number;
  total: number;
  cancelled: boolean;
}

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

export interface ImportValidationError {
  row: number;
  column: string;
  value: string;
  message: string;
}

export interface ImportValidationResult {
  valid: boolean;
  errors: ImportValidationError[];
  coercedRows: Record<string, unknown>[];
}

export interface ColumnMapping {
  csvHeader: string;
  tableColumn: string | null;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Pure helpers (module-scope, no React state)
// ---------------------------------------------------------------------------

/**
 * Auto-detect whether a file uses tabs or commas as the field delimiter
 * by counting occurrences in the first line.
 */
function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return tabs > commas ? '\t' : ',';
}

/**
 * RFC 4180–compliant parser for delimited text.
 * Returns a 2-D array of strings (each sub-array is one row).
 */
function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(current);
      current = '';
    } else if (ch === '\n') {
      row.push(current);
      current = '';
      rows.push(row);
      row = [];
    } else if (ch === '\r') {
      // skip; the \n will commit the row
    } else {
      current += ch;
    }
  }

  if (current || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows;
}

/** Escape a value for inclusion in a CSV field (RFC 4180). */
function escapeCSVField(value: string): string {
  if (
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

/** Stringify a cell value safely, avoiding `[object Object]`. */
function stringifyCellValue(val: unknown): string {
  if (val == null) return '';
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * CSV/TSV import and export for the ChildTable.
 *
 * Ported from the Angular `ChildTableImportService`.
 *
 * @remarks
 * - Handles RFC 4180–style CSV: quoted fields, escaped double-quotes, mixed
 *   line endings (`\n`, `\r\n`), and tab-separated values.
 * - Validates imported rows against column definitions (type coercion,
 *   required fields, unique constraints).
 * - Exports current table data as a downloadable CSV file.
 * - Provides automatic column-header-to-table-column mapping by name
 *   similarity (Levenshtein-based).
 */
export function useChildTableImport<T extends Record<string, unknown>>() {
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const cancelledRef = useRef(false);

  // -----------------------------------------------------------------------
  // CSV Parsing
  // -----------------------------------------------------------------------

  /**
   * Parse a CSV or TSV file into headers and a 2-D array of string values.
   *
   * Handles:
   * - Quoted fields containing commas, tabs, and newlines
   * - Escaped quotes (`""`)
   * - `\r\n` and `\n` line endings
   * - Tab-separated values (auto-detected by inspecting the first line)
   */
  const parseCSV = useCallback(
    async (file: File): Promise<ParsedCSV> => {
      cancelledRef.current = false;
      setImportProgress({ phase: 'parsing', current: 0, total: 0, cancelled: false });

      const text = await file.text();
      const delimiter = detectDelimiter(text);
      const rows = parseDelimited(text, delimiter);

      if (rows.length === 0) {
        setImportProgress({ phase: 'complete', current: 0, total: 0, cancelled: false });
        return { headers: [], rows: [] };
      }

      const headers = rows[0];
      const dataRows = rows.slice(1);

      setImportProgress({
        phase: 'complete',
        current: dataRows.length,
        total: dataRows.length,
        cancelled: false,
      });

      return { headers, rows: dataRows };
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  /**
   * Validate imported rows against column definitions.
   *
   * Checks:
   * - Required fields are non-empty.
   * - Values can be coerced to the column's type (via `coerceValue`).
   * - Unique columns have no duplicate values across rows.
   *
   * @param rows      - 2-D string array of data rows (matching column order).
   * @param columns   - The table column definitions to validate against.
   * @returns Validation result with errors and coerced row data.
   */
  const validateImportData = useCallback(
    (
      rows: string[][],
      columns: ChildTableColumn<T>[],
    ): ImportValidationResult => {
      cancelledRef.current = false;
      setImportProgress({
        phase: 'validating',
        current: 0,
        total: rows.length,
        cancelled: false,
      });

      const errors: ImportValidationError[] = [];
      const coercedRows: Record<string, unknown>[] = [];
      const uniqueTracker = new Map<string, Set<string>>();

      for (const col of columns) {
        if (col.isUnique) {
          uniqueTracker.set(col.key, new Set());
        }
      }

      for (let ri = 0; ri < rows.length; ri++) {
        if (cancelledRef.current) {
          setImportProgress((prev) =>
            prev ? { ...prev, cancelled: true } : null,
          );
          return { valid: false, errors, coercedRows };
        }

        const row = rows[ri];
        const coerced: Record<string, unknown> = {};

        for (let ci = 0; ci < columns.length; ci++) {
          const col = columns[ci];
          const raw = row[ci] ?? '';
          const trimmed = raw.trim();

          const isRequired = col.validation?.some((v) => v.type === 'required');
          if (isRequired && trimmed === '') {
            errors.push({
              row: ri + 1,
              column: col.label,
              value: raw,
              message: `"${col.label}" is required`,
            });
            coerced[col.key] = raw;
            continue;
          }

          const result = coerceValue(trimmed, col.type);
          if (result.error) {
            errors.push({
              row: ri + 1,
              column: col.label,
              value: raw,
              message: result.error,
            });
            coerced[col.key] = raw;
            continue;
          }

          if (col.isUnique && trimmed !== '') {
            const tracker = uniqueTracker.get(col.key);
            const normalised = trimmed.toLowerCase();
            if (tracker?.has(normalised)) {
              errors.push({
                row: ri + 1,
                column: col.label,
                value: raw,
                message: `Duplicate value "${trimmed}" in unique column "${col.label}"`,
              });
            } else {
              tracker?.add(normalised);
            }
          }

          coerced[col.key] = result.value;
        }

        coercedRows.push(coerced);

        if ((ri + 1) % 100 === 0 || ri === rows.length - 1) {
          setImportProgress({
            phase: 'validating',
            current: ri + 1,
            total: rows.length,
            cancelled: false,
          });
        }
      }

      setImportProgress({
        phase: 'complete',
        current: rows.length,
        total: rows.length,
        cancelled: false,
      });

      return { valid: errors.length === 0, errors, coercedRows };
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Export
  // -----------------------------------------------------------------------

  /**
   * Download current table data as a CSV file.
   *
   * @param columns  - Visible columns to include.
   * @param rows     - Data rows (objects keyed by column key).
   * @param filename - Desired file name (without extension is fine).
   */
  const downloadCSV = useCallback(
    (
      columns: ChildTableColumn<T>[],
      rows: Array<Record<string, unknown>>,
      filename: string,
    ) => {
      const header = columns.map((c) => escapeCSVField(c.label)).join(',');
      const dataLines = rows.map((row) =>
        columns
          .map((col) => escapeCSVField(stringifyCellValue(row[col.key])))
          .join(','),
      );

      const csv = [header, ...dataLines].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      requestAnimationFrame(() => {
        link.remove();
        URL.revokeObjectURL(url);
      });
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Column Mapping
  // -----------------------------------------------------------------------

  /**
   * Automatically map CSV headers to table column definitions using
   * case-insensitive name similarity (Levenshtein distance).
   *
   * @param csvHeaders    - Header row from the parsed CSV.
   * @param tableColumns  - The target table column definitions.
   * @returns An array of mappings from CSV header to table column key.
   */
  const mapColumnsToFields = useCallback(
    (
      csvHeaders: string[],
      tableColumns: ChildTableColumn<T>[],
    ): ColumnMapping[] => {
      setImportProgress({
        phase: 'mapping',
        current: 0,
        total: csvHeaders.length,
        cancelled: false,
      });

      const usedColumns = new Set<string>();
      const mappings: ColumnMapping[] = [];

      for (let i = 0; i < csvHeaders.length; i++) {
        const mapping = matchSingleHeader(csvHeaders[i], tableColumns, usedColumns);
        mappings.push(mapping);

        if (mapping.tableColumn) usedColumns.add(mapping.tableColumn);

        setImportProgress({
          phase: 'mapping',
          current: i + 1,
          total: csvHeaders.length,
          cancelled: false,
        });
      }

      setImportProgress({
        phase: 'complete',
        current: csvHeaders.length,
        total: csvHeaders.length,
        cancelled: false,
      });

      return mappings;
    },
    [],
  );

  /** Cancel an in-progress import operation. */
  const cancelImport = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  return {
    /** Current import progress (null when idle). */
    importProgress,
    parseCSV,
    validateImportData,
    downloadCSV,
    mapColumnsToFields,
    cancelImport,
  } as const;
}

// ---------------------------------------------------------------------------
// Column matching (module-scope)
// ---------------------------------------------------------------------------

/** Match a single CSV header to the best available table column. */
function matchSingleHeader<T extends Record<string, unknown>>(
  rawHeader: string,
  tableColumns: ChildTableColumn<T>[],
  usedColumns: Set<string>,
): ColumnMapping {
  const csvHeader = rawHeader.trim();
  const csvLower = csvHeader.toLowerCase();

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const col of tableColumns) {
    if (usedColumns.has(col.key)) continue;

    const labelLower = col.label.toLowerCase();
    const keyLower = col.key.toLowerCase();
    const fieldLower = (col.fieldName ?? '').toLowerCase();

    if (csvLower === labelLower || csvLower === keyLower || csvLower === fieldLower) {
      return { csvHeader, tableColumn: col.key, confidence: 1 };
    }

    if (labelLower.includes(csvLower) || csvLower.includes(labelLower)) {
      if (0.8 > bestScore) {
        bestScore = 0.8;
        bestMatch = col.key;
      }
      continue;
    }

    const sim = levenshteinSimilarity(csvLower, labelLower);
    if (sim > bestScore && sim >= 0.6) {
      bestScore = sim;
      bestMatch = col.key;
    }

    const keySim = levenshteinSimilarity(csvLower, keyLower);
    if (keySim > bestScore && keySim >= 0.6) {
      bestScore = keySim;
      bestMatch = col.key;
    }
  }

  return { csvHeader, tableColumn: bestMatch, confidence: bestScore };
}

// ---------------------------------------------------------------------------
// String similarity (Levenshtein)
// ---------------------------------------------------------------------------

/**
 * Compute the normalised similarity (0–1) between two strings using
 * Levenshtein distance. Returns 1 for identical strings, 0 for completely
 * different ones.
 */
function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/** Classic Wagner-Fischer algorithm for edit distance. */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from<number>({ length: n + 1 }).fill(0),
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[m][n];
}
