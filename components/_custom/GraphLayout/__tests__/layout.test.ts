import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import { layoutWithDagre } from '../layout';

describe('layoutWithDagre', () => {
  it('returns nodes/edges unchanged when given an empty graph', () => {
    const result = layoutWithDagre([], []);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('positions nodes and sets handle positions for left-to-right layout', () => {
    const nodes: Node[] = [
      { id: 'a', position: { x: 0, y: 0 }, data: {} },
      { id: 'b', position: { x: 0, y: 0 }, data: {} },
      { id: 'c', position: { x: 0, y: 0 }, data: {} },
    ];
    const edges: Edge[] = [
      { id: 'a-b', source: 'a', target: 'b' },
      { id: 'b-c', source: 'b', target: 'c' },
    ];

    const result = layoutWithDagre(nodes, edges);

    expect(result.nodes).toHaveLength(3);
    for (const n of result.nodes) {
      expect(n.position.x).not.toBeNaN();
      expect(n.position.y).not.toBeNaN();
      expect(n.sourcePosition).toBe('right');
      expect(n.targetPosition).toBe('left');
    }
  });

  it('switches handle positions for top-to-bottom layouts', () => {
    const nodes: Node[] = [
      { id: 'a', position: { x: 0, y: 0 }, data: {} },
      { id: 'b', position: { x: 0, y: 0 }, data: {} },
    ];
    const edges: Edge[] = [{ id: 'a-b', source: 'a', target: 'b' }];

    const result = layoutWithDagre(nodes, edges, { direction: 'TB' });

    expect(result.nodes[0].sourcePosition).toBe('bottom');
    expect(result.nodes[0].targetPosition).toBe('top');
  });

  it('orders nodes along the rank for a chain', () => {
    const nodes: Node[] = [
      { id: 'a', position: { x: 0, y: 0 }, data: {} },
      { id: 'b', position: { x: 0, y: 0 }, data: {} },
      { id: 'c', position: { x: 0, y: 0 }, data: {} },
    ];
    const edges: Edge[] = [
      { id: 'a-b', source: 'a', target: 'b' },
      { id: 'b-c', source: 'b', target: 'c' },
    ];

    const { nodes: positioned } = layoutWithDagre(nodes, edges, { direction: 'LR' });
    const xs = positioned.map((n) => n.position.x);

    expect(xs[0]).toBeLessThan(xs[1]);
    expect(xs[1]).toBeLessThan(xs[2]);
  });
});
