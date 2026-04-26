/**
 * Page-builder component registry.
 *
 * One canonical registry consumed by the editor (palette + properties), the
 * runtime renderer, and migrations. Mirrors the GAB Core `ComponentRegistry`
 * shape (PropDefinition + categories) so layout interchange between Omega and
 * GAB Core is direct: a page exported from one renders in the other.
 *
 * Keep this file UI-free: no React imports. The renderer maps `type` → React
 * via a separate switch in `components/_custom/page-builder/render`.
 */

export type PageComponentCategory =
  | 'content'
  | 'data'
  | 'forms'
  | 'navigation'
  | 'media'
  | 'charts'
  | 'layout'
  | 'containers'
  | 'custom';

export const CATEGORY_ORDER: PageComponentCategory[] = [
  'layout',
  'containers',
  'content',
  'data',
  'forms',
  'navigation',
  'media',
  'charts',
  'custom',
];

export const CATEGORY_LABELS: Record<PageComponentCategory, string> = {
  layout: 'Layout',
  containers: 'Containers',
  content: 'Content',
  data: 'Data',
  forms: 'Forms',
  navigation: 'Navigation',
  media: 'Media',
  charts: 'Charts',
  custom: 'Custom',
};

/**
 * Property editor types — superset of GAB Core `PropDefinition.editor`.
 * Editors are interpreted by `PropertiesPanel`; unknown types fall back
 * to a JSON textarea so adapters never break the editor.
 */
export type PropEditor =
  | 'string'
  | 'number'
  | 'boolean'
  | 'multiline'
  | 'select'
  | 'color'
  | 'icon'
  /** Comma-separated list rendered as a multi-input. */
  | 'list'
  /** Raw JSON for power users / array values. */
  | 'json'
  /** Custom-component-only: a child block id (rare). */
  | 'block-ref'
  /** Container children — edited via `ContainerChildEditor` not in the panel. */
  | 'children-slot';

export interface PropDefinition {
  /** Property key under `component.props`. */
  key: string;
  /** Human label rendered in the panel. */
  label: string;
  editor: PropEditor;
  /** Optional default value applied on instance creation. */
  defaultValue?: unknown;
  /** Optional help string under the editor. */
  description?: string;
  /** For `editor: 'select'`. */
  options?: Array<{ value: string; label: string }>;
  /** Widen columns this prop occupies in the panel grid (1 or 2). */
  span?: 1 | 2;
  /**
   * Hide the editor when a predicate against current props is false.
   * Used for "show only when X is set" patterns.
   */
  visibleWhen?: (props: Record<string, unknown>) => boolean;
}

/**
 * Tag a registry entry with the data shape it expects when bound to a
 * table/record/query source. Mirrors GAB's `dataBinding` capability flag.
 */
export type DataShape =
  /** Doesn't read data. */
  | 'none'
  /** A list of records (table or query). */
  | 'records'
  /** A single record. */
  | 'record'
  /** A single value (number/string) — used by metric/chart widgets. */
  | 'scalar';

export interface PageComponentDefinition {
  /** Canonical type string (e.g. `metric-card`, `data-table`, `tabs-container`). */
  type: string;
  label: string;
  category: PageComponentCategory;
  /** Lucide icon name (rendered by the palette). */
  icon?: string;
  /** Short tooltip for the palette. */
  description?: string;
  /** Default props applied when a new instance is created. */
  defaultProps: Record<string, unknown>;
  /** Property definitions (for the typed PropertiesPanel). */
  props: PropDefinition[];
  /** Data shape this component reads (drives the DataBindingEditor). */
  dataShape?: DataShape;
  /**
   * If true, the component accepts `children: PageComponent[]` and renders
   * them in nested slots (tabs / conditional / collapsible / card-with-body).
   */
  isContainer?: boolean;
  /**
   * Default colSpan when a new instance is added to a row. Defaults to the
   * row's column count (full-width).
   */
  defaultColSpan?: number;
  /**
   * If true, this is a custom (user-defined) component coming from the
   * `gab_custom_components` table. The renderer mounts it inside a sandboxed
   * iframe.
   */
  isCustom?: boolean;
  /**
   * Legacy/aliased type strings — when a stored layout uses one of these,
   * the renderer will resolve to this definition. Allows interchange with
   * GAB Core's earlier type names.
   */
  aliases?: string[];
  /**
   * Optional dotted-path module flag (see `config/modules.config.ts`). When
   * set, the palette filters this entry out and the editor refuses to
   * insert it if the module is disabled. Stored layouts already using a
   * disabled type still render — the renderer is intentionally lenient so
   * a feature flip never blanks an existing page mid-flight.
   */
  featureFlag?: string;
}

class PageComponentRegistry {
  private byType = new Map<string, PageComponentDefinition>();
  private byAlias = new Map<string, string>();

  register(def: PageComponentDefinition): void {
    if (this.byType.has(def.type)) {
      console.warn(`[page-builder] re-registering component type: ${def.type}`);
    }
    this.byType.set(def.type, def);
    if (def.aliases) {
      for (const a of def.aliases) {
        this.byAlias.set(a, def.type);
      }
    }
  }

  registerAll(defs: PageComponentDefinition[]): void {
    for (const d of defs) this.register(d);
  }

  /** Lookup with alias resolution. Returns undefined for unknown types. */
  get(type: string): PageComponentDefinition | undefined {
    if (this.byType.has(type)) return this.byType.get(type);
    const canonical = this.byAlias.get(type);
    return canonical ? this.byType.get(canonical) : undefined;
  }

  /** Required version that throws — useful in editor selection paths. */
  getOrThrow(type: string): PageComponentDefinition {
    const def = this.get(type);
    if (!def) throw new Error(`Unknown page component type: ${type}`);
    return def;
  }

  has(type: string): boolean {
    return this.get(type) !== undefined;
  }

  /**
   * Resolve a stored type to its canonical type string (alias-safe).
   * Returns the input unchanged if no alias exists. Used by migrations.
   */
  resolveType(type: string): string {
    if (this.byType.has(type)) return type;
    return this.byAlias.get(type) ?? type;
  }

  list(): PageComponentDefinition[] {
    return Array.from(this.byType.values());
  }

  /** Group registered components by category for the palette UI. */
  byCategory(): Record<PageComponentCategory, PageComponentDefinition[]> {
    const out: Record<PageComponentCategory, PageComponentDefinition[]> = {
      layout: [],
      containers: [],
      content: [],
      data: [],
      forms: [],
      navigation: [],
      media: [],
      charts: [],
      custom: [],
    };
    for (const def of this.byType.values()) {
      out[def.category].push(def);
    }
    return out;
  }

  /** Removes a registered type — used for hot-reloading custom components. */
  unregister(type: string): void {
    const def = this.byType.get(type);
    if (!def) return;
    this.byType.delete(type);
    if (def.aliases) {
      for (const a of def.aliases) this.byAlias.delete(a);
    }
  }
}

/**
 * Module-singleton registry. The bundler de-dupes this so editor + renderer
 * see the same instance even though they live in separate React subtrees.
 */
export const pageComponentRegistry = new PageComponentRegistry();
