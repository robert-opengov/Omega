import dagre from '@dagrejs/dagre';
import type { Edge, Node } from '@xyflow/react';

export interface LayoutOptions {
  /** Layout direction. @default 'LR' (left-to-right) */
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  /** Node width hint in pixels. @default 220 */
  nodeWidth?: number;
  /** Node height hint in pixels. @default 64 */
  nodeHeight?: number;
  /** Horizontal separation between nodes. @default 60 */
  nodeSep?: number;
  /** Vertical separation between ranks. @default 80 */
  rankSep?: number;
}

/**
 * Position xyflow nodes using dagre's hierarchical layout. Returns brand-new
 * node objects with `position` set; edges are returned unchanged so callers
 * can pass them straight to `<ReactFlow />`.
 */
export function layoutWithDagre<T extends Node, E extends Edge>(
  nodes: T[],
  edges: E[],
  options: LayoutOptions = {},
): { nodes: T[]; edges: E[] } {
  const {
    direction = 'LR',
    nodeWidth = 220,
    nodeHeight = 64,
    nodeSep = 60,
    rankSep = 80,
  } = options;

  if (nodes.length === 0) return { nodes, edges };

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: nodeSep, ranksep: rankSep });

  for (const node of nodes) {
    g.setNode(node.id, {
      width: node.width ?? nodeWidth,
      height: node.height ?? nodeHeight,
    });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const isHorizontal = direction === 'LR' || direction === 'RL';

  const positioned = nodes.map((node) => {
    const dn = g.node(node.id);
    if (!dn) return node;
    return {
      ...node,
      position: { x: dn.x - (node.width ?? nodeWidth) / 2, y: dn.y - (node.height ?? nodeHeight) / 2 },
      sourcePosition: isHorizontal ? ('right' as const) : ('bottom' as const),
      targetPosition: isHorizontal ? ('left' as const) : ('top' as const),
    } as T;
  });

  return { nodes: positioned, edges };
}
