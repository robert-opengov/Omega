/**
 * Pure validation and type coercion utilities.
 * No framework dependencies.
 */
import type { ColumnType, ValidationRule } from './models/table.models';
import type { CoerceResult } from './models/cell.models';

export function checkValidationRule(
  rule: ValidationRule,
  value: unknown,
  rowData?: unknown,
): string | null {
  switch (rule.type) {
    case 'required':
      if (!value && value !== 0) return rule.message;
      break;
    case 'min':
      if (Number(value) < Number(rule.value)) return rule.message;
      break;
    case 'max':
      if (Number(value) > Number(rule.value)) return rule.message;
      break;
    case 'pattern':
      if (!new RegExp(String(rule.value)).test(String(value))) return rule.message;
      break;
    case 'custom':
      if (rule.validator && !rule.validator(value, rowData)) return rule.message;
      break;
  }
  return null;
}

export function validateCell(
  rules: ValidationRule[] | undefined,
  value: unknown,
  rowData?: unknown,
): string | null {
  if (!rules) return null;
  for (const rule of rules) {
    const error = checkValidationRule(rule, value, rowData);
    if (error) return error;
  }
  return null;
}

/** Coerce a raw string (from paste or import) into the appropriate typed value for a given column type. */
export function coerceValue(raw: string, type: ColumnType): CoerceResult {
  const trimmed = (raw ?? '').trim();

  switch (type) {
    case 'number':
    case 'currency': {
      if (trimmed === '') return { value: null, error: null };
      const cleaned = trimmed.replace(/[$,\s]/g, '');
      const num = Number(cleaned);
      if (Number.isNaN(num)) return { value: raw, error: `"${trimmed}" is not a valid number` };
      return { value: num, error: null };
    }
    case 'integer': {
      if (trimmed === '') return { value: null, error: null };
      const num = Number.parseInt(trimmed.replace(/[,\s]/g, ''), 10);
      if (Number.isNaN(num)) return { value: raw, error: `"${trimmed}" is not a valid integer` };
      return { value: num, error: null };
    }
    case 'checkbox': {
      const lower = trimmed.toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(lower)) return { value: true, error: null };
      if (['false', '0', 'no', 'off', ''].includes(lower)) return { value: false, error: null };
      return { value: raw, error: `"${trimmed}" is not a valid boolean` };
    }
    case 'date': {
      if (trimmed === '') return { value: '', error: null };
      const d = new Date(trimmed);
      if (Number.isNaN(d.getTime())) return { value: raw, error: `"${trimmed}" is not a valid date` };
      return { value: trimmed, error: null };
    }
    case 'datetime': {
      if (trimmed === '') return { value: '', error: null };
      const d = new Date(trimmed);
      if (Number.isNaN(d.getTime())) return { value: raw, error: `"${trimmed}" is not a valid date/time` };
      return { value: trimmed, error: null };
    }
    case 'email': {
      if (trimmed === '') return { value: '', error: null };
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(trimmed)) return { value: raw, error: `"${trimmed}" is not a valid email` };
      return { value: trimmed, error: null };
    }
    case 'phone': {
      if (trimmed === '') return { value: '', error: null };
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) return { value: raw, error: `"${trimmed}" is not a valid phone number` };
      return { value: trimmed, error: null };
    }
    case 'formula':
      return { value: raw, error: 'Formula fields are read-only' };
    case 'multiselect':
    case 'select':
    case 'text':
    case 'textarea':
    case 'pii':
    case 'user':
    case 'file':
    case 'attachment':
    default:
      return { value: raw, error: null };
  }
}

/** Get the default empty value for a given column type. */
export function getDefaultValue(type: ColumnType): unknown {
  switch (type) {
    case 'number':
    case 'integer':
    case 'currency':
      return null;
    case 'checkbox':
      return false;
    case 'multiselect':
      return [];
    default:
      return '';
  }
}
