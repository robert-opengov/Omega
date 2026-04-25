'use client';

import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import { Sigma, Link2, Variable } from 'lucide-react';
import { Text } from '@/components/ui/atoms';
import { cn } from '@/lib/utils';
import { layoutWithDagre } from '@/components/_custom/GraphLayout';
import type { DependencyGraph } from '@/lib/core/ports/app.repository';

import '@xyflow/react/dist/style.css';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 56;

type FieldNodeData = {
  fieldName: string;
  fieldKey: string;
  dependencyType: string;
};

function iconForType(type: string) {
  if (type === 'formula') return <Sigma className="h-3.5 w-3.5 text-info-text" />;
  if (type === 'lookup') return <Link2 className="h-3.5 w-3.5 text-info-text" />;
  if (type === 'summary') return <Sigma className="h-3.5 w-3.5 text-warning-text" />;
  return <Variable className="h-3.5 w-3.5 text-primary" />;
}

function bgForType(type: string) {
  if (type === 'formula') return 'border-info-light-border bg-info-light';
  if (type === 'summary') return 'border-warning-light-border bg-warning-light';
  if (type === 'lookup') return 'border-info-light-border bg-info-light';
  return 'border-border bg-card';
}

function FieldNode({ data }: NodeProps<Node<FieldNodeData>>) {
  return (
    <div
      className={cn(
        'rounded border px-2.5 py-1.5 shadow-sm flex items-center gap-2',
        bgForType(data.dependencyType),
      )}
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-border !border-0 !w-2 !h-2"
      />
      {iconForType(data.dependencyType)}
      <div className="min-w-0">
        <Text size="xs" weight="medium" className="truncate">{data.fieldName}</Text>
        <Text size="xs" color="muted" className="font-mono truncate text-[10px]">
          {data.fieldKey}
        </Text>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-border !border-0 !w-2 !h-2"
      />
    </div>
  );
}

const nodeTypes = { field: FieldNode };

export function DependencyGraphView({ graph }: { graph: DependencyGraph }) {
  const { nodes, edges } = useMemo(() => {
    if (graph.nodes.length === 0) {
      return { nodes: [] as Node[], edges: [] as Edge[] };
    }

    const baseNodes: Node<FieldNodeData>[] = graph.nodes.map((n) => ({
      id: n.fieldId,
      type: 'field',
      data: {
        fieldName: n.fieldName,
        fieldKey: n.fieldKey,
        dependencyType: n.dependencyType,
      },
      position: { x: 0, y: 0 },
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    }));

    const baseEdges: Edge[] = graph.edges.map((e, i) => ({
      id: `${e.source}->${e.target}-${i}`,
      source: e.source,
      target: e.target,
      style: { stroke: 'var(--color-primary, #4f46e5)', strokeWidth: 1 },
      animated: false,
    }));

    return layoutWithDagre(baseNodes, baseEdges, {
      direction: 'LR',
      nodeWidth: NODE_WIDTH,
      nodeHeight: NODE_HEIGHT,
      nodeSep: 40,
      rankSep: 100,
    });
  }, [graph]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded border border-dashed border-border bg-muted/30">
        <Text size="sm" color="muted">
          No computed fields yet. Add a formula, lookup, or summary field to populate the graph.
        </Text>
      </div>
    );
  }

  return (
    <div className="rounded border border-border bg-muted/20" style={{ height: 420 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable className="!bg-background !border !border-border" />
      </ReactFlow>
    </div>
  );
}
