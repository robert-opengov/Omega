import { describe, it, expect } from 'vitest';
import {
  checkValidationRule,
  validateCell,
  coerceValue,
  getDefaultValue,
} from '../core/validators';
import type { ValidationRule } from '../core/models';

describe('checkValidationRule', () => {
  it('required: fails on null/undefined/empty', () => {
    const rule: ValidationRule = { type: 'required', message: 'Required' };
    expect(checkValidationRule(rule, null)).toBe('Required');
    expect(checkValidationRule(rule, undefined)).toBe('Required');
    expect(checkValidationRule(rule, '')).toBe('Required');
  });

  it('required: passes on 0 and non-empty strings', () => {
    const rule: ValidationRule = { type: 'required', message: 'Required' };
    expect(checkValidationRule(rule, 0)).toBeNull();
    expect(checkValidationRule(rule, 'hello')).toBeNull();
  });

  it('min: validates numeric minimum', () => {
    const rule: ValidationRule = { type: 'min', value: 10, message: 'Too small' };
    expect(checkValidationRule(rule, 5)).toBe('Too small');
    expect(checkValidationRule(rule, 10)).toBeNull();
    expect(checkValidationRule(rule, 15)).toBeNull();
  });

  it('max: validates numeric maximum', () => {
    const rule: ValidationRule = { type: 'max', value: 100, message: 'Too big' };
    expect(checkValidationRule(rule, 101)).toBe('Too big');
    expect(checkValidationRule(rule, 100)).toBeNull();
  });

  it('pattern: validates regex', () => {
    const rule: ValidationRule = { type: 'pattern', value: '^[A-Z]', message: 'Must start uppercase' };
    expect(checkValidationRule(rule, 'hello')).toBe('Must start uppercase');
    expect(checkValidationRule(rule, 'Hello')).toBeNull();
  });

  it('custom: runs custom validator', () => {
    const rule: ValidationRule = {
      type: 'custom',
      message: 'Must be even',
      validator: (v) => Number(v) % 2 === 0,
    };
    expect(checkValidationRule(rule, 3)).toBe('Must be even');
    expect(checkValidationRule(rule, 4)).toBeNull();
  });
});

describe('validateCell', () => {
  it('returns null when no rules', () => {
    expect(validateCell(undefined, 'anything')).toBeNull();
    expect(validateCell([], 'anything')).toBeNull();
  });

  it('returns first error from multiple rules', () => {
    const rules: ValidationRule[] = [
      { type: 'required', message: 'Required' },
      { type: 'min', value: 5, message: 'Min 5' },
    ];
    expect(validateCell(rules, '')).toBe('Required');
  });
});

describe('coerceValue', () => {
  it('coerces text values', () => {
    expect(coerceValue('hello', 'text')).toEqual({ value: 'hello', error: null });
    expect(coerceValue('', 'text')).toEqual({ value: '', error: null });
  });

  it('coerces number values', () => {
    expect(coerceValue('42', 'number')).toEqual({ value: 42, error: null });
    expect(coerceValue('3.14', 'number')).toEqual({ value: 3.14, error: null });
  });

  it('returns error for invalid number', () => {
    const result = coerceValue('abc', 'number');
    expect(result.error).toBeTruthy();
  });

  it('coerces integer values', () => {
    expect(coerceValue('42', 'integer')).toEqual({ value: 42, error: null });
  });

  it('coerces currency values', () => {
    const result = coerceValue('1234.56', 'currency');
    expect(result.value).toBe(1234.56);
    expect(result.error).toBeNull();
  });

  it('coerces checkbox values', () => {
    expect(coerceValue('true', 'checkbox')).toEqual({ value: true, error: null });
    expect(coerceValue('1', 'checkbox')).toEqual({ value: true, error: null });
    expect(coerceValue('yes', 'checkbox')).toEqual({ value: true, error: null });
    expect(coerceValue('false', 'checkbox')).toEqual({ value: false, error: null });
    expect(coerceValue('0', 'checkbox')).toEqual({ value: false, error: null });
  });

  it('handles empty string: returns null for number, empty for date', () => {
    expect(coerceValue('', 'number')).toEqual({ value: null, error: null });
    expect(coerceValue('', 'date')).toEqual({ value: '', error: null });
  });

  it('validates email format', () => {
    expect(coerceValue('a@b.com', 'email').error).toBeNull();
    expect(coerceValue('not-email', 'email').error).toBeTruthy();
  });

  it('marks formula as read-only error', () => {
    const result = coerceValue('anything', 'formula');
    expect(result.error).toContain('read-only');
  });
});

describe('getDefaultValue', () => {
  it('returns appropriate defaults for each type', () => {
    expect(getDefaultValue('text')).toBe('');
    expect(getDefaultValue('number')).toBeNull();
    expect(getDefaultValue('checkbox')).toBe(false);
    expect(getDefaultValue('select')).toBe('');
    expect(getDefaultValue('multiselect')).toEqual([]);
  });
});
