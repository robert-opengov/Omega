/**
 * Register a list of `GabCustomComponent`s into the page-builder registry.
 *
 * Custom components are stored per-app in GAB and surfaced in the editor's
 * palette under the "Custom" category. They use a `custom:<key>` type prefix
 * so the runtime can route them to the sandboxed iframe renderer
 * (`CustomComponentBlock`) instead of the built-in switch in
 * `blocks-registry.tsx`.
 *
 * This module is import-safe in both server and client trees — it touches
 * only the registry singleton.
 */

import type { GabCustomComponent } from '@/lib/core/ports/custom-components.repository';
import {
  pageComponentRegistry,
  type PageComponentDefinition,
  type PropDefinition,
} from './page-component-registry';

/**
 * Build a canonical type string for a custom component. Stored layouts use
 * this exact string under `PageComponent.type`, which is why the renderer
 * recognises the `custom:` prefix.
 */
export function customTypeFor(key: string): string {
  return `custom:${key}`;
}

/**
 * Convert a `GabCustomComponent` into a registry definition. Best-effort
 * mapping — if the component supplies a JSON `propsSchema` we use it for
 * typed editors; otherwise we fall back to a single `json` editor over
 * `props`.
 */
export function toDefinition(c: GabCustomComponent): PageComponentDefinition {
  const props = derivePropDefs(c.propsSchema);
  return {
    type: customTypeFor(c.key),
    label: c.name,
    category: 'custom',
    icon: c.icon || 'Box',
    description: c.description ?? undefined,
    defaultProps: (c.defaultProps as Record<string, unknown>) ?? {},
    props,
    dataShape: c.dataBindingSupported ? 'records' : 'none',
    isCustom: true,
  };
}

/**
 * Register an array of custom components, replacing any prior registrations
 * (so updates pick up new code/labels). Safe to call repeatedly — it diffs
 * against the existing entries by canonical type.
 */
export function registerCustomComponents(items: GabCustomComponent[]): void {
  // Clean any previously registered custom-typed entries that are no longer
  // present so deletes/renames take effect during long-lived sessions.
  const incomingTypes = new Set(items.map((i) => customTypeFor(i.key)));
  for (const def of pageComponentRegistry.list()) {
    if (def.isCustom && !incomingTypes.has(def.type)) {
      pageComponentRegistry.unregister(def.type);
    }
  }

  for (const c of items) {
    const def = toDefinition(c);
    if (pageComponentRegistry.has(def.type)) {
      pageComponentRegistry.unregister(def.type);
    }
    pageComponentRegistry.register(def);
  }
}

/**
 * Best-effort conversion from a stored `propsSchema` (JSON object describing
 * fields) into the typed `PropDefinition[]` understood by `PropertiesPanel`.
 * Tolerates an empty / unknown schema and returns an empty list which falls
 * back to the raw JSON editor.
 */
function derivePropDefs(raw: unknown): PropDefinition[] {
  if (!raw || typeof raw !== 'object') return [];
  const schema = raw as Record<string, unknown>;
  const out: PropDefinition[] = [];

  // GAB stores propsSchema as either:
  //   { fields: [{ key, label, type }] }
  //   { properties: { foo: { type: 'string' } } } (JSON Schema-ish)
  //   { foo: 'string', bar: 'number' } (free-form map)
  const fields = Array.isArray(schema.fields) ? (schema.fields as Record<string, unknown>[]) : null;
  if (fields) {
    for (const f of fields) {
      const key = String(f.key ?? '');
      if (!key) continue;
      out.push({
        key,
        label: String(f.label ?? key),
        editor: editorFromType(f.type ?? f.editor),
        defaultValue: f.default ?? f.defaultValue,
      });
    }
    return out;
  }

  const properties = (schema.properties ?? null) as Record<string, unknown> | null;
  if (properties && typeof properties === 'object') {
    for (const [key, val] of Object.entries(properties)) {
      const v = (val ?? {}) as Record<string, unknown>;
      out.push({
        key,
        label: String(v.title ?? v.label ?? key),
        editor: editorFromType(v.type),
        defaultValue: v.default,
      });
    }
    return out;
  }

  for (const [key, val] of Object.entries(schema)) {
    if (typeof val === 'string') {
      out.push({ key, label: key, editor: editorFromType(val) });
    }
  }
  return out;
}

function editorFromType(t: unknown): PropDefinition['editor'] {
  switch (t) {
    case 'string':
    case 'text':
      return 'string';
    case 'multiline':
    case 'textarea':
      return 'multiline';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
    case 'bool':
      return 'boolean';
    case 'select':
    case 'enum':
      return 'select';
    case 'color':
      return 'color';
    case 'icon':
      return 'icon';
    case 'list':
    case 'array':
      return 'list';
    default:
      return 'json';
  }
}
