'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type OnEdgesChange,
  type OnNodesChange,
  type OnSelectionChangeFunc,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TriggerNode } from './nodes/TriggerNode';
import { ConditionNode } from './nodes/ConditionNode';
import { ActionNode } from './nodes/ActionNode';
import { ApprovalNode } from './nodes/ApprovalNode';
import { EndNode } from './nodes/EndNode';
import type { WorkflowNodeData } from '../serializer';

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
  approval: ApprovalNode,
  end: EndNode,
};

export interface WorkflowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onNodeSelect: (node: Node | null) => void;
  className?: string;
  readOnly?: boolean;
}

function WorkflowCanvasInner({
  nodes: externalNodes,
  edges: externalEdges,
  onNodesChange: onNodesChangeParent,
  onEdgesChange: onEdgesChangeParent,
  onNodeSelect,
  readOnly,
}: Readonly<WorkflowCanvasProps>) {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState<Edge>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { fitView, screenToFlowPosition } = useReactFlow();
  const syncedRef = useRef(false);

  useEffect(() => {
    setNodes(externalNodes);
    setEdges(externalEdges);
    if (!syncedRef.current && (externalNodes.length > 0 || externalEdges.length > 0)) {
      syncedRef.current = true;
      const t = setTimeout(() => fitView({ padding: 0.25 }), 100);
      return () => clearTimeout(t);
    }
  }, [externalNodes, externalEdges, setNodes, setEdges, fitView]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        const next = addEdge({ ...params, animated: true }, eds);
        onEdgesChangeParent(next);
        return next;
      });
    },
    [setEdges, onEdgesChangeParent],
  );

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChangeInternal(changes);
      setNodes((current) => {
        onNodesChangeParent(current);
        return current;
      });
    },
    [onNodesChangeInternal, setNodes, onNodesChangeParent],
  );

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChangeInternal(changes);
      setEdges((current) => {
        onEdgesChangeParent(current);
        return current;
      });
    },
    [onEdgesChangeInternal, setEdges, onEdgesChangeParent],
  );

  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes: selectedNodes }) => {
      onNodeSelect(selectedNodes.length === 1 ? selectedNodes[0] : null);
    },
    [onNodeSelect],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (readOnly) return;
      const raw = event.dataTransfer.getData('application/workflow-node');
      if (!raw) return;

      const { type, stepType } = JSON.parse(raw) as { type: string; stepType: string };
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

      const newNode: Node<WorkflowNodeData> = {
        id: `step-${Date.now()}`,
        type,
        position,
        data: {
          label: stepType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          stepType,
          role: stepType === 'approval_gate' ? 'Manager' : 'System',
          config: {},
        },
      };

      setNodes((nds) => {
        const next = [...nds, newNode];
        onNodesChangeParent(next);
        return next;
      });
    },
    [setNodes, onNodesChangeParent, screenToFlowPosition, readOnly],
  );

  return (
    <div
      ref={wrapperRef}
      className="relative flex-1 min-w-0 bg-muted/20"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        deleteKeyCode={readOnly ? null : 'Delete'}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          className="!bg-background !border !border-border"
        />
      </ReactFlow>
    </div>
  );
}

export function WorkflowCanvas(props: Readonly<WorkflowCanvasProps>) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

export default WorkflowCanvas;
