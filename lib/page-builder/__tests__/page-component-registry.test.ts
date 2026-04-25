import { describe, it, expect } from 'vitest';
import '../registry-init';
import { pageComponentRegistry, CATEGORY_ORDER } from '../page-component-registry';

describe('pageComponentRegistry', () => {
  it('registers built-in canonical types', () => {
    expect(pageComponentRegistry.has('text-block')).toBe(true);
    expect(pageComponentRegistry.has('metric-card')).toBe(true);
    expect(pageComponentRegistry.has('data-table')).toBe(true);
    expect(pageComponentRegistry.has('spacer')).toBe(true);
  });

  it('resolves legacy aliases to canonical type strings', () => {
    expect(pageComponentRegistry.resolveType('atom_text')).toBe('text-block');
    expect(pageComponentRegistry.resolveType('mol_metric_card')).toBe('metric-card');
    expect(pageComponentRegistry.resolveType('pb_spacer')).toBe('spacer');
  });

  it('returns the same definition for an alias and the canonical name', () => {
    const viaAlias = pageComponentRegistry.get('atom_text');
    const viaCanonical = pageComponentRegistry.get('text-block');
    expect(viaAlias).toBeDefined();
    expect(viaAlias).toBe(viaCanonical);
  });

  it('byCategory groups every registered definition into a known category', () => {
    const grouped = pageComponentRegistry.byCategory();
    const total = Object.values(grouped).reduce((acc, arr) => acc + arr.length, 0);
    expect(total).toBe(pageComponentRegistry.list().length);
    for (const cat of CATEGORY_ORDER) {
      expect(grouped[cat]).toBeDefined();
    }
  });

  it('returns undefined for unknown types and resolveType is identity', () => {
    expect(pageComponentRegistry.has('not-a-real-type')).toBe(false);
    expect(pageComponentRegistry.resolveType('not-a-real-type')).toBe('not-a-real-type');
  });
});
