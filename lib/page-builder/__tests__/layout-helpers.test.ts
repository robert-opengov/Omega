import { describe, it, expect } from 'vitest';
import {
  emptyPageLayout,
  withReorderedComponents,
  createBlockInstance,
  collapseLayoutToOneRow,
} from '../layout-helpers';

describe('layout-helpers', () => {
  it('emptyPageLayout has one row', () => {
    const l = emptyPageLayout();
    expect(l.rows).toHaveLength(1);
    expect(l.rows[0].components).toHaveLength(0);
  });

  it('reorders components in single row', () => {
    const a = createBlockInstance('atom_text');
    const b = createBlockInstance('atom_badge');
    const layout = collapseLayoutToOneRow({
      type: 'grid',
      rows: [{ id: 'r', columns: 1, components: [a, b] }],
    });
    const next = withReorderedComponents(layout, 0, 1);
    const flat = next.rows[0]!.components;
    expect(flat[0].type).toBe('atom_badge');
  });
});
