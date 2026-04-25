import type { PageComponent, PageLayout } from '@/lib/core/ports/pages.repository';
import { SHOWCASE_BLOCKS_BY_ID } from './showcase-block-manifest';

export function makeComponentId(): string {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function makeRowId(): string {
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Canvas default: one full-width row */
export function emptyPageLayout(): PageLayout {
  return {
    type: 'grid',
    rows: [
      {
        id: makeRowId(),
        columns: 1,
        components: [],
      },
    ],
  };
}

export function normalizePageLayout(raw: unknown): PageLayout {
  if (!raw || typeof raw !== 'object') return emptyPageLayout();
  const o = raw as PageLayout;
  if (o.type === 'grid' && Array.isArray(o.rows) && o.rows.length > 0) {
    return o as PageLayout;
  }
  return emptyPageLayout();
}

function defaultPropsForType(type: string): Record<string, unknown> {
  return { ...(SHOWCASE_BLOCKS_BY_ID[type]?.defaultProps ?? {}) };
}

export function createBlockInstance(type: string): PageComponent {
  return {
    id: makeComponentId(),
    type,
    props: defaultPropsForType(type),
  };
}

/**
 * v1 editor canvas = one row with all components (merges multiple API rows in order).
 */
export function collapseLayoutToOneRow(layout: PageLayout): PageLayout {
  const all = getComponentsFlat(layout);
  if (all.length === 0) {
    return emptyPageLayout();
  }
  return {
    type: 'grid',
    rows: [
      {
        id: layout.rows[0]?.id ?? makeRowId(),
        columns: 1,
        components: all,
      },
    ],
  };
}

export function withReorderedComponents(
  layout: PageLayout,
  fromIndex: number,
  toIndex: number,
): PageLayout {
  const one = collapseLayoutToOneRow(layout);
  const first = one.rows[0];
  if (!first) return emptyPageLayout();
  const next = [...first.components];
  const [moved] = next.splice(fromIndex, 1);
  if (moved !== undefined) next.splice(toIndex, 0, moved);
  return {
    type: 'grid',
    rows: [{ ...first, components: next }],
  };
}

export function withAppendedBlock(layout: PageLayout, comp: PageComponent): PageLayout {
  if (layout.rows.length === 0) {
    return { type: 'grid', rows: [{ id: makeRowId(), columns: 1, components: [comp] }] };
  }
  const [first, ...rest] = layout.rows;
  return {
    type: 'grid',
    rows: [
      { ...first, components: [...first.components, comp] },
      ...rest,
    ],
  };
}

export function withUpdatedComponent(
  layout: PageLayout,
  id: string,
  patch: Partial<PageComponent>,
): PageLayout {
  return {
    ...layout,
    rows: layout.rows.map((r) => ({
      ...r,
      components: r.components.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
  };
}

export function withDeletedComponent(layout: PageLayout, id: string): PageLayout {
  return {
    ...layout,
    rows: layout.rows
      .map((r) => ({
        ...r,
        components: r.components.filter((c) => c.id !== id),
      }))
      .filter((r) => r.components.length > 0),
  };
}

export function getComponentsFlat(layout: PageLayout): PageComponent[] {
  return layout.rows.flatMap((r) => r.components);
}
