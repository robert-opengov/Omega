import { describe, it, expect, beforeEach } from 'vitest';
import '../registry-init';
import { pageComponentRegistry } from '../page-component-registry';
import {
  customTypeFor,
  registerCustomComponents,
  toDefinition,
} from '../register-custom';
import type { GabCustomComponent } from '@/lib/core/ports/custom-components.repository';

function makeComponent(overrides: Partial<GabCustomComponent> = {}): GabCustomComponent {
  return {
    id: '1',
    key: 'kpi-tile',
    name: 'KPI Tile',
    description: 'A KPI tile',
    icon: 'Activity',
    code: 'export default function(){ return null; }',
    propsSchema: null,
    defaultProps: { label: 'Metric' },
    dataBindingSupported: false,
    createdBy: null,
    visibility: 'app',
    version: 1,
    codeHistory: null,
    sourcePageKey: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('register-custom', () => {
  beforeEach(() => {
    // Drop any previously registered custom entries so each test starts clean.
    for (const def of pageComponentRegistry.list()) {
      if (def.isCustom) pageComponentRegistry.unregister(def.type);
    }
  });

  it('uses a `custom:` prefix for canonical type strings', () => {
    expect(customTypeFor('foo')).toBe('custom:foo');
  });

  it('toDefinition copies metadata + tags as custom', () => {
    const def = toDefinition(makeComponent());
    expect(def.type).toBe('custom:kpi-tile');
    expect(def.label).toBe('KPI Tile');
    expect(def.category).toBe('custom');
    expect(def.isCustom).toBe(true);
    expect(def.dataShape).toBe('none');
  });

  it('registerCustomComponents adds every entry to the registry', () => {
    registerCustomComponents([
      makeComponent({ key: 'a', name: 'Alpha' }),
      makeComponent({ key: 'b', name: 'Beta' }),
    ]);
    expect(pageComponentRegistry.has('custom:a')).toBe(true);
    expect(pageComponentRegistry.has('custom:b')).toBe(true);
  });

  it('removes stale custom entries on subsequent registrations', () => {
    registerCustomComponents([makeComponent({ key: 'a' })]);
    registerCustomComponents([makeComponent({ key: 'b' })]);
    expect(pageComponentRegistry.has('custom:a')).toBe(false);
    expect(pageComponentRegistry.has('custom:b')).toBe(true);
  });

  it('flips dataShape to records when dataBindingSupported', () => {
    const def = toDefinition(makeComponent({ dataBindingSupported: true }));
    expect(def.dataShape).toBe('records');
  });

  it('builds typed PropDefinitions from a `fields` schema', () => {
    const def = toDefinition(
      makeComponent({
        propsSchema: {
          fields: [
            { key: 'title', label: 'Title', type: 'string' },
            { key: 'count', label: 'Count', type: 'number' },
          ],
        },
      }),
    );
    expect(def.props).toHaveLength(2);
    expect(def.props[0]!).toMatchObject({ key: 'title', editor: 'string' });
    expect(def.props[1]!).toMatchObject({ key: 'count', editor: 'number' });
  });

  it('builds typed PropDefinitions from a JSON Schema-style properties map', () => {
    const def = toDefinition(
      makeComponent({
        propsSchema: {
          properties: {
            label: { type: 'string', title: 'Label' },
            on: { type: 'boolean' },
          },
        },
      }),
    );
    expect(def.props.find((p) => p.key === 'label')?.editor).toBe('string');
    expect(def.props.find((p) => p.key === 'on')?.editor).toBe('boolean');
  });

  it('falls back to no typed props when schema is unknown', () => {
    const def = toDefinition(makeComponent({ propsSchema: undefined }));
    expect(def.props).toEqual([]);
  });
});
