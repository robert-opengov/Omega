import { describe, expect, it } from 'vitest';
import { validateCsv } from '../validate';
import type { GabField } from '@/lib/core/ports/field.repository';

function field(partial: Partial<GabField> & Pick<GabField, 'key' | 'name' | 'type'>): GabField {
  return {
    id: partial.key,
    tableId: 't',
    sortOrder: 0,
    createdAt: '',
    isSystem: false,
    required: false,
    ...partial,
  };
}

describe('validateCsv', () => {
  const fields: GabField[] = [
    field({ key: 'name', name: 'Name', type: 'text', required: true }),
    field({ key: 'count', name: 'Count', type: 'integer' }),
    field({ key: 'active', name: 'Active', type: 'boolean' }),
    field({ key: 'email', name: 'Email', type: 'email' }),
  ];

  it('matches headers case-insensitively against name and key', () => {
    const result = validateCsv({
      headers: ['Name', 'count', 'Active', 'Email'],
      rows: [['Alice', '42', 'yes', 'a@b.co']],
      fields,
    });
    expect(result.totalRows).toBe(1);
    expect(result.totalRowsWithErrors).toBe(0);
    expect(result.rows[0].values).toEqual({
      name: 'Alice',
      count: 42,
      active: true,
      email: 'a@b.co',
    });
  });

  it('flags non-numeric values for integer fields', () => {
    const result = validateCsv({
      headers: ['Name', 'Count'],
      rows: [['Alice', 'not a number']],
      fields,
    });
    expect(result.totalErrors).toBeGreaterThan(0);
    expect(result.rows[0].errors.some((e) => e.fieldKey === 'count')).toBe(true);
  });

  it('reports missing required values', () => {
    const result = validateCsv({
      headers: ['Name', 'Count'],
      rows: [['', '1']],
      fields,
    });
    expect(result.rows[0].errors.some((e) => e.fieldKey === 'name')).toBe(true);
  });

  it('flags malformed emails', () => {
    const result = validateCsv({
      headers: ['Name', 'Email'],
      rows: [['x', 'not-an-email']],
      fields,
    });
    expect(result.rows[0].errors.some((e) => e.fieldKey === 'email')).toBe(true);
  });

  it('lists unmatched headers', () => {
    const result = validateCsv({
      headers: ['Name', 'Mystery'],
      rows: [['Alice', 'unused']],
      fields,
    });
    expect(result.unmatchedHeaders).toContain('Mystery');
    expect(result.rows[0].values).toEqual({ name: 'Alice' });
  });

  it('honors explicit mapping override', () => {
    const result = validateCsv({
      headers: ['Funky', 'Count'],
      rows: [['Alice', '7']],
      fields,
      mapping: { Funky: 'name' },
    });
    expect(result.rows[0].values).toEqual({ name: 'Alice', count: 7 });
  });
});
