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
import { Database } from 'lucide-react';
import { Badge, Text } from '@/components/ui/atoms';
import { layoutWithDagre } from '@/components/_custom/GraphLayout';
import type { GabRelationship } from '@/lib/core/ports/relationship.repository';
import type { GabTable } from '@/lib/core/ports/table.repository';

import '@xyflow/react/dist/style.css';

type TableNodeData = {
  name: string;
  tableKey: string;
};

const NODE_WIDTH = 220;
const NODE_HEIGHT = 64;

function TableNode({ data }: NodeProps<Node<TableNodeData>>) {
  return (
    <div
      className="rounded-lg border border-border bg-card shadow-sm px-3 py-2 flex items-center gap-2"
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-border !border-0 !w-2 !h-2"
      />
      <div className="h-8 w-8 rounded bg-primary-light flex items-center justify-center shrink-0">
        <Database className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <Text size="sm" weight="medium" className="truncate">{data.name}</Text>
        <Text size="xs" color="muted" className="font-mono truncate">{data.tableKey}</Text>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-border !border-0 !w-2 !h-2"
      />
    </div>
  );
}

const nodeTypes = { table: TableNode };

export interface RelationshipsERDProps {
  tables: GabTable[];
  relationships: GabRelationship[];
}

export function RelationshipsERD({ tables, relationships }: RelationshipsERDProps) {
  const { nodes, edges } = useMemo(() => {
    if (tables.length === 0) {
      return { nodes: [] as Node[], edges: [] as Edge[] };
    }

    const baseNodes: Node<TableNodeData>[] = tables.map((t) => ({
      id: t.id,
      type: 'table',
      data: { name: t.name, tableKey: t.key },
      position: { x: 0, y: 0 },
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    }));

    const baseEdges: Edge[] = relationships.map((r) => ({
      id: r.id,
      source: r.parentTableId,
      target: r.childTableId,
      label: r.type,
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
      labelStyle: { fontSize: 10, fontWeight: 500 },
      style: { stroke: 'var(--color-primary, #4f46e5)', strokeWidth: 1.5 },
      animated: false,
    }));

    return layoutWithDagre(baseNodes, baseEdges, {
      direction: 'LR',
      nodeWidth: NODE_WIDTH,
      nodeHeight: NODE_HEIGHT,
    });
  }, [tables, relationships]);

  if (tables.length === 0) {
    return (
      <div className="flex items-center justify-center h-72 rounded border border-dashed border-border bg-muted/30">
        <Text size="sm" color="muted">No tables to display.</Text>
      </div>
    );
  }

  return (
    <div className="rounded border border-border bg-muted/20" style={{ height: 480 }}>
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
      <div className="px-3 py-2 border-t border-border flex items-center gap-3 text-xs text-muted-foreground">
        <Badge variant="default" size="sm">{tables.length} tables</Badge>
        <Badge variant="info" size="sm">{relationships.length} relationships</Badge>
      </div>
    </div>
  );
}
