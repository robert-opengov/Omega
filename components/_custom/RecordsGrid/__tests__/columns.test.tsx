import { describe, expect, it } from 'vitest';
import { buildColumnsFromFields, isEditable } from '../columns';
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

describe('buildColumnsFromFields', () => {
  it('skips system fields by default and respects sortOrder', () => {
    const fields = [
      field({ key: 'b', name: 'B', type: 'text', sortOrder: 2 }),
      field({ key: 'a', name: 'A', type: 'text', sortOrder: 1 }),
      field({ key: '_id', name: 'Id', type: 'text', isSystem: true, sortOrder: 0 }),
    ];

    const cols = buildColumnsFromFields(fields);

    expect(cols.map((c) => c.key)).toEqual(['a', 'b']);
  });

  it('honors a visibleKeys list (legacy positional arg)', () => {
    const fields = [
      field({ key: 'a', name: 'A', type: 'text', sortOrder: 0 }),
      field({ key: 'b', name: 'B', type: 'text', sortOrder: 1 }),
    ];

    const cols = buildColumnsFromFields(fields, ['a']);

    expect(cols.map((c) => c.key)).toEqual(['a']);
  });

  it('honors a visibleKeys list via options object', () => {
    const fields = [
      field({ key: 'a', name: 'A', type: 'text', sortOrder: 0 }),
      field({ key: 'b', name: 'B', type: 'text', sortOrder: 1 }),
    ];

    const cols = buildColumnsFromFields(fields, { visibleKeys: ['b'] });

    expect(cols.map((c) => c.key)).toEqual(['b']);
  });
});

describe('isEditable', () => {
  it('marks plain fields as editable', () => {
    expect(isEditable(field({ key: 'a', name: 'A', type: 'text' }))).toBe(true);
  });

  it('rejects system fields', () => {
    expect(
      isEditable(field({ key: 'a', name: 'A', type: 'text', isSystem: true })),
    ).toBe(false);
  });

  it('rejects formula / lookup / summary fields', () => {
    expect(
      isEditable(field({ key: 'a', name: 'A', type: 'text', formula: '1 + 1' })),
    ).toBe(false);
    expect(
      isEditable(
        field({
          key: 'a',
          name: 'A',
          type: 'text',
          lookupConfig: { sourceTable: 't', sourceFieldName: 'x' },
        }),
      ),
    ).toBe(false);
    expect(
      isEditable(
        field({
          key: 'a',
          name: 'A',
          type: 'text',
          summaryConfig: {
            childTable: 't',
            childFieldName: 'x',
            aggregation: 'COUNT',
          },
        }),
      ),
    ).toBe(false);
  });
});
