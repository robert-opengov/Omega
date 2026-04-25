import { describe, it, expect } from 'vitest';
import '../registry-init';
import { PAGE_TEMPLATES } from '../page-templates';
import { pageComponentRegistry } from '../page-component-registry';

describe('PAGE_TEMPLATES', () => {
  it('exposes a non-empty list with unique ids', () => {
    expect(PAGE_TEMPLATES.length).toBeGreaterThan(0);
    const ids = PAGE_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(PAGE_TEMPLATES.map((t) => [t.id, t]))(
    'template %s builds a valid PageLayout',
    (_id, template) => {
      const layout = template.build();
      expect(layout.type).toBe('grid');
      expect(layout.rows.length).toBeGreaterThan(0);
      for (const row of layout.rows) {
        expect(typeof row.id).toBe('string');
        expect(row.columns).toBeGreaterThan(0);
        for (const comp of row.components) {
          expect(typeof comp.id).toBe('string');
          // every emitted type should resolve to a known canonical component
          expect(pageComponentRegistry.has(comp.type)).toBe(true);
        }
      }
    },
  );

  it('produces fresh ids per invocation', () => {
    const t = PAGE_TEMPLATES.find((x) => x.id === 'dashboard')!;
    const a = t.build();
    const b = t.build();
    expect(a.rows[0]!.id).not.toBe(b.rows[0]!.id);
    expect(a.rows[0]!.components[0]!.id).not.toBe(b.rows[0]!.components[0]!.id);
  });
});
