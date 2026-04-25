/**
 * Pure helpers that mutate `PageLayout` immutably. The editor uses these
 * exclusively so React state updates are predictable and testable.
 *
 * These helpers preserve true multi-row layout — there is no "collapse to one
 * row" pass anymore. The editor exposes row-level controls (add row, change
 * column count, set responsive breakpoints) and per-component colSpan.
 */

import './registry-init';
import { pageComponentRegistry } from './page-component-registry';
import type {
  PageComponent,
  PageLayout,
  PageRow,
} from '@/lib/core/ports/pages.repository';

export function makeComponentId(): string {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function makeRowId(): string {
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Empty canvas — one full-width row. */
export function emptyPageLayout(): PageLayout {
  return {
    type: 'grid',
    rows: [makeEmptyRow(1)],
  };
}

export function makeEmptyRow(columns: number = 1): PageRow {
  return {
    id: makeRowId(),
    columns,
    columnsMd: undefined,
    columnsSm: undefined,
    gap: 16,
    components: [],
  };
}

/**
 * Coerce arbitrary stored layout shape into a valid `PageLayout`. Migrates
 * legacy alias `type` strings to canonical types (read-only for stored rows).
 */
export function normalizePageLayout(raw: unknown): PageLayout {
  if (!raw || typeof raw !== 'object') return emptyPageLayout();
  const o = raw as PageLayout;
  if (o.type !== 'grid' || !Array.isArray(o.rows) || o.rows.length === 0) {
    return emptyPageLayout();
  }
  return {
    type: 'grid',
    rows: o.rows.map((r) => ({
      id: r.id ?? makeRowId(),
      columns: typeof r.columns === 'number' && r.columns > 0 ? r.columns : 1,
      columnsMd: r.columnsMd,
      columnsSm: r.columnsSm,
      gap: r.gap,
      components: Array.isArray(r.components) ? r.components.map(migrateComponent) : [],
    })),
  };
}

/**
 * Recursively migrate alias `type` strings to canonical ones, preserving
 * children recursively. Unknown types are kept as-is so the renderer can show
 * an "Unknown block" placeholder.
 */
function migrateComponent(c: PageComponent): PageComponent {
  const canonical = pageComponentRegistry.resolveType(c.type);
  return {
    ...c,
    id: c.id ?? makeComponentId(),
    type: canonical,
    children: c.children?.map(migrateComponent),
  };
}

/**
 * @deprecated kept for back-compat with the older single-row editor. Use
 * `normalizePageLayout` instead. This version no longer collapses; it just
 * normalises so legacy callers do not lose multi-row data.
 */
export function collapseLayoutToOneRow(layout: PageLayout): PageLayout {
  return normalizePageLayout(layout);
}

function defaultPropsForType(type: string): Record<string, unknown> {
  const def = pageComponentRegistry.get(type);
  return def ? { ...def.defaultProps } : {};
}

export function createBlockInstance(type: string): PageComponent {
  return {
    id: makeComponentId(),
    type: pageComponentRegistry.resolveType(type),
    props: defaultPropsForType(type),
  };
}

// ─── Row operations ─────────────────────────────────────────────────────────

export function withAddedRow(
  layout: PageLayout,
  columns: number = 1,
  index?: number,
): PageLayout {
  const row = makeEmptyRow(columns);
  const at = typeof index === 'number' ? index : layout.rows.length;
  const next = [...layout.rows];
  next.splice(at, 0, row);
  return { type: 'grid', rows: next };
}

export function withDeletedRow(layout: PageLayout, rowId: string): PageLayout {
  const next = layout.rows.filter((r) => r.id !== rowId);
  return { type: 'grid', rows: next.length > 0 ? next : [makeEmptyRow(1)] };
}

export function withUpdatedRow(
  layout: PageLayout,
  rowId: string,
  patch: Partial<Omit<PageRow, 'id' | 'components'>>,
): PageLayout {
  return {
    ...layout,
    rows: layout.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
  };
}

export function withMovedRow(
  layout: PageLayout,
  fromIndex: number,
  toIndex: number,
): PageLayout {
  const next = [...layout.rows];
  const [moved] = next.splice(fromIndex, 1);
  if (moved) next.splice(toIndex, 0, moved);
  return { type: 'grid', rows: next };
}

// ─── Component operations ──────────────────────────────────────────────────

/**
 * Append a new component to the given row (or the last row if `rowId` is
 * omitted). Default colSpan = full row.
 */
export function withAppendedBlock(
  layout: PageLayout,
  comp: PageComponent,
  rowId?: string,
): PageLayout {
  const targetRowId = rowId ?? layout.rows[layout.rows.length - 1]?.id;
  if (!targetRowId) {
    return { type: 'grid', rows: [{ ...makeEmptyRow(1), components: [comp] }] };
  }
  return {
    ...layout,
    rows: layout.rows.map((r) =>
      r.id === targetRowId ? { ...r, components: [...r.components, comp] } : r,
    ),
  };
}

export function withUpdatedComponent(
  layout: PageLayout,
  id: string,
  patch: Partial<PageComponent>,
): PageLayout {
  function visit(comps: PageComponent[]): PageComponent[] {
    return comps.map((c) => {
      if (c.id === id) return { ...c, ...patch };
      if (c.children?.length) return { ...c, children: visit(c.children) };
      return c;
    });
  }
  return {
    ...layout,
    rows: layout.rows.map((r) => ({ ...r, components: visit(r.components) })),
  };
}

export function withDeletedComponent(layout: PageLayout, id: string): PageLayout {
  function visit(comps: PageComponent[]): PageComponent[] {
    const filtered = comps.filter((c) => c.id !== id);
    return filtered.map((c) => (c.children ? { ...c, children: visit(c.children) } : c));
  }
  return {
    ...layout,
    rows: layout.rows.map((r) => ({ ...r, components: visit(r.components) })),
  };
}

/**
 * Move a component to a new row + position index. Used by drag-end handlers
 * when components are dragged across rows. Both indices clamp to bounds.
 */
export function withMovedComponent(
  layout: PageLayout,
  componentId: string,
  toRowId: string,
  toIndex: number,
): PageLayout {
  let dragged: PageComponent | undefined;
  const stripped = layout.rows.map((r) => {
    const idx = r.components.findIndex((c) => c.id === componentId);
    if (idx === -1) return r;
    dragged = r.components[idx];
    return { ...r, components: r.components.filter((c) => c.id !== componentId) };
  });
  if (!dragged) return layout;

  return {
    ...layout,
    rows: stripped.map((r) => {
      if (r.id !== toRowId) return r;
      const next = [...r.components];
      const at = Math.max(0, Math.min(toIndex, next.length));
      next.splice(at, 0, dragged!);
      return { ...r, components: next };
    }),
  };
}

/**
 * Reorder components within a single row (used when DnD stays in-row).
 */
export function withReorderedComponents(
  layout: PageLayout,
  rowId: string,
  fromIndex: number,
  toIndex: number,
): PageLayout {
  return {
    ...layout,
    rows: layout.rows.map((r) => {
      if (r.id !== rowId) return r;
      const next = [...r.components];
      const [moved] = next.splice(fromIndex, 1);
      if (moved !== undefined) next.splice(toIndex, 0, moved);
      return { ...r, components: next };
    }),
  };
}

// ─── Read helpers ──────────────────────────────────────────────────────────

export function getComponentsFlat(layout: PageLayout): PageComponent[] {
  const out: PageComponent[] = [];
  function visit(comps: PageComponent[]) {
    for (const c of comps) {
      out.push(c);
      if (c.children?.length) visit(c.children);
    }
  }
  for (const r of layout.rows) visit(r.components);
  return out;
}

export function findComponent(
  layout: PageLayout,
  id: string,
): { component: PageComponent; rowId: string; index: number } | null {
  for (const r of layout.rows) {
    const idx = r.components.findIndex((c) => c.id === id);
    if (idx !== -1) {
      return { component: r.components[idx]!, rowId: r.id, index: idx };
    }
    for (const c of r.components) {
      if (c.children?.length) {
        const child = c.children.find((x) => x.id === id);
        if (child) return { component: child, rowId: r.id, index: -1 };
      }
    }
  }
  return null;
}

/** Number of cells (sum of colSpans clamped to row.columns) used by a row. */
export function rowFillCount(row: PageRow): number {
  return row.components.reduce((acc, c) => {
    const s = typeof c.colSpan === 'number' ? c.colSpan : row.columns;
    return acc + Math.min(Math.max(s, 1), row.columns);
  }, 0);
}
