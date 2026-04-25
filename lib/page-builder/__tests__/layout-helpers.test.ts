import { describe, it, expect } from 'vitest';
import {
  emptyPageLayout,
  withReorderedComponents,
  withMovedComponent,
  withAddedRow,
  withDeletedRow,
  withUpdatedComponent,
  withDeletedComponent,
  createBlockInstance,
  normalizePageLayout,
  findComponent,
  rowFillCount,
} from '../layout-helpers';

describe('layout-helpers', () => {
  it('emptyPageLayout has one row', () => {
    const l = emptyPageLayout();
    expect(l.rows).toHaveLength(1);
    expect(l.rows[0]!.components).toHaveLength(0);
  });

  it('reorders components within a single row', () => {
    const a = createBlockInstance('text-block');
    const b = createBlockInstance('badge');
    const layout = normalizePageLayout({
      type: 'grid',
      rows: [{ id: 'r1', columns: 2, components: [a, b] }],
    });
    const next = withReorderedComponents(layout, 'r1', 0, 1);
    expect(next.rows[0]!.components[0]!.type).toBe('badge');
    expect(next.rows[0]!.components[1]!.type).toBe('text-block');
  });

  it('moves a component across rows', () => {
    const a = createBlockInstance('text-block');
    const b = createBlockInstance('badge');
    const layout = normalizePageLayout({
      type: 'grid',
      rows: [
        { id: 'r1', columns: 1, components: [a] },
        { id: 'r2', columns: 1, components: [b] },
      ],
    });
    const next = withMovedComponent(layout, a.id, 'r2', 0);
    expect(next.rows[0]!.components).toHaveLength(0);
    expect(next.rows[1]!.components.map((c) => c.type)).toEqual(['text-block', 'badge']);
  });

  it('adds and deletes rows, preserving at least one', () => {
    let layout = emptyPageLayout();
    layout = withAddedRow(layout, 3);
    expect(layout.rows).toHaveLength(2);
    expect(layout.rows[1]!.columns).toBe(3);

    layout = withDeletedRow(layout, layout.rows[0]!.id);
    expect(layout.rows).toHaveLength(1);

    // Deleting the last row keeps a single fresh row.
    const empty = withDeletedRow(layout, layout.rows[0]!.id);
    expect(empty.rows).toHaveLength(1);
    expect(empty.rows[0]!.components).toHaveLength(0);
  });

  it('migrates legacy alias type strings', () => {
    const layout = normalizePageLayout({
      type: 'grid',
      rows: [
        {
          id: 'r1',
          columns: 1,
          components: [
            { id: 'c1', type: 'atom_text', props: { children: 'hi' } },
            { id: 'c2', type: 'mol_metric_card', props: {} },
          ],
        },
      ],
    });
    expect(layout.rows[0]!.components[0]!.type).toBe('text-block');
    expect(layout.rows[0]!.components[1]!.type).toBe('metric-card');
  });

  it('updates and deletes a specific component by id', () => {
    const a = createBlockInstance('text-block');
    const b = createBlockInstance('badge');
    let layout = normalizePageLayout({
      type: 'grid',
      rows: [{ id: 'r1', columns: 1, components: [a, b] }],
    });
    layout = withUpdatedComponent(layout, a.id, { props: { content: 'updated' } });
    expect(layout.rows[0]!.components[0]!.props.content).toBe('updated');
    layout = withDeletedComponent(layout, a.id);
    expect(layout.rows[0]!.components).toHaveLength(1);
    expect(layout.rows[0]!.components[0]!.id).toBe(b.id);
  });

  it('finds nested children via findComponent', () => {
    const child = createBlockInstance('text-block');
    const parent = {
      ...createBlockInstance('tabs-container'),
      children: [child],
    };
    const layout = normalizePageLayout({
      type: 'grid',
      rows: [{ id: 'r1', columns: 1, components: [parent] }],
    });
    expect(findComponent(layout, child.id)?.component.id).toBe(child.id);
  });

  it('rowFillCount sums clamped colSpans', () => {
    const a = { ...createBlockInstance('text-block'), colSpan: 2 };
    const b = { ...createBlockInstance('badge'), colSpan: 1 };
    const row = { id: 'r1', columns: 3, components: [a, b] };
    expect(rowFillCount(row)).toBe(3);
  });
});
