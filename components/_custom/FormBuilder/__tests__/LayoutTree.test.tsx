import { describe, expect, it } from 'vitest';
import { reorderItems } from '../_components/LayoutTree';

describe('LayoutTree reorderItems', () => {
  it('drag-reorder updates item order', () => {
    const items = [
      { id: 'a', type: 'text', text: 'A' },
      { id: 'b', type: 'text', text: 'B' },
      { id: 'c', type: 'text', text: 'C' },
    ] as any;

    const next = reorderItems(items, 'a', 'c');
    expect(next.map((item: any) => item.id)).toEqual(['b', 'c', 'a']);
  });
});
