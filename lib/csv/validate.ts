/**
 * CSV row validator — pure, server-safe, used by the bulk
 * ImportStepper (`app.csvImportStepper`).
 *
 * Validates a parsed CSV against the destination table's `GabField[]`,
 * one row at a time. Returns a structured per-row report so the wizard
 * can show users exactly which cells need fixing before they commit
 * the import.
 *
 * Intentionally returns coerced values alongside errors so the wizard
 * can show a "what gets imported" preview without re-running coercion.
 */

import type { GabField } from '@/lib/core/ports/field.repository';

export interface CsvValidationCellError {
  fieldKey: string;
  fieldName: string;
  raw: string;
  message: string;
}

export interface CsvValidationRow {
  rowIndex: number; // 1-based, matches the line in the spreadsheet
  values: Record<string, unknown>;
  errors: CsvValidationCellError[];
  warnings: CsvValidationCellError[];
}

export interface CsvValidationResult {
  rows: CsvValidationRow[];
  totalRows: number;
  totalRowsWithErrors: number;
  totalErrors: number;
  totalWarnings: number;
  unmatchedHeaders: string[];
}

export interface ValidateCsvOptions {
  /** Headers in the CSV, in order. */
  headers: string[];
  /** Parsed string cells, one array per row. */
  rows: string[][];
  /** Field metadata for the destination table. */
  fields: GabField[];
  /**
   * Optional override of header → field key. If not provided, headers
   * are matched case-insensitively against `field.key` and `field.name`.
   */
  mapping?: Record<string, string | null>;
}

const TRUE_TOKENS = new Set(['true', '1', 'yes', 'y', 't']);
const FALSE_TOKENS = new Set(['false', '0', 'no', 'n', 'f', '']);

function coerceField(field: GabField, raw: string): {
  value: unknown;
  error?: string;
  warning?: string;
} {
  const value = raw.trim();
  switch (field.type) {
    case 'boolean':
    case 'checkbox': {
      const lc = value.toLowerCase();
      if (TRUE_TOKENS.has(lc)) return { value: true };
      if (FALSE_TOKENS.has(lc)) return { value: false };
      return { value, error: `"${raw}" is not a valid boolean (expected true/false)` };
    }
    case 'integer': {
      if (value === '') return { value: null };
      const n = Number(value);
      if (!Number.isInteger(n)) {
        return { value, error: `"${raw}" is not an integer` };
      }
      return { value: n };
    }
    case 'number':
    case 'decimal':
    case 'currency': {
      if (value === '') return { value: null };
      const n = Number(value.replace(/[$,]/g, ''));
      if (!Number.isFinite(n)) {
        return { value, error: `"${raw}" is not a number` };
      }
      return { value: n };
    }
    case 'date':
    case 'datetime': {
      if (value === '') return { value: null };
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) {
        return { value, error: `"${raw}" is not a valid date` };
      }
      return { value: d.toISOString() };
    }
    case 'json':
    case 'object': {
      if (value === '') return { value: null };
      try {
        return { value: JSON.parse(value) };
      } catch {
        return { value, warning: 'Cell stored as text; JSON could not be parsed' };
      }
    }
    case 'email': {
      if (value === '') return { value: null };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return { value, error: `"${raw}" is not a valid email` };
      }
      return { value };
    }
    case 'url': {
      if (value === '') return { value: null };
      try {
        new URL(value);
        return { value };
      } catch {
        return { value, error: `"${raw}" is not a valid URL` };
      }
    }
    default:
      return { value: value === '' ? null : value };
  }
}

function isFieldRequired(field: GabField): boolean {
  return Boolean(field.required) && !field.isSystem;
}

function buildHeaderMapping(
  headers: string[],
  fields: GabField[],
  override: Record<string, string | null> | undefined,
): Map<number, GabField | null> {
  const byKey = new Map(fields.map((f) => [f.key.toLowerCase(), f]));
  const byName = new Map(fields.map((f) => [f.name.toLowerCase(), f]));
  const map = new Map<number, GabField | null>();
  headers.forEach((header, idx) => {
    const trimmed = header.trim();
    if (override) {
      const explicit = override[trimmed];
      if (explicit === null) {
        map.set(idx, null);
        return;
      }
      if (explicit) {
        const field = fields.find((f) => f.key === explicit);
        map.set(idx, field ?? null);
        return;
      }
    }
    const lc = trimmed.toLowerCase();
    map.set(idx, byKey.get(lc) ?? byName.get(lc) ?? null);
  });
  return map;
}

export function validateCsv({ headers, rows, fields, mapping }: ValidateCsvOptions): CsvValidationResult {
  const mappedHeaders = buildHeaderMapping(headers, fields, mapping);
  const unmatched: string[] = [];
  mappedHeaders.forEach((field, idx) => {
    if (!field) unmatched.push(headers[idx]);
  });

  const requiredFields = fields.filter(isFieldRequired);
  const out: CsvValidationRow[] = [];
  let totalErrors = 0;
  let totalWarnings = 0;
  let rowsWithErrors = 0;

  rows.forEach((row, rIdx) => {
    const values: Record<string, unknown> = {};
    const errors: CsvValidationCellError[] = [];
    const warnings: CsvValidationCellError[] = [];

    mappedHeaders.forEach((field, idx) => {
      if (!field) return;
      const raw = row[idx] ?? '';
      const result = coerceField(field, raw);
      if (result.value !== undefined) {
        values[field.key] = result.value;
      }
      if (result.error) {
        errors.push({ fieldKey: field.key, fieldName: field.name, raw, message: result.error });
      }
      if (result.warning) {
        warnings.push({ fieldKey: field.key, fieldName: field.name, raw, message: result.warning });
      }
    });

    requiredFields.forEach((field) => {
      const v = values[field.key];
      if (v === null || v === undefined || v === '') {
        errors.push({
          fieldKey: field.key,
          fieldName: field.name,
          raw: '',
          message: `${field.name} is required`,
        });
      }
    });

    if (errors.length > 0) rowsWithErrors += 1;
    totalErrors += errors.length;
    totalWarnings += warnings.length;

    out.push({ rowIndex: rIdx + 2, values, errors, warnings });
  });

  return {
    rows: out,
    totalRows: rows.length,
    totalRowsWithErrors: rowsWithErrors,
    totalErrors,
    totalWarnings,
    unmatchedHeaders: unmatched,
  };
}
