'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, History, PlayCircle, Save, Undo2 } from 'lucide-react';
import type { Edge, Node } from '@xyflow/react';
import { Button, Input, Select, Switch, Text } from '@/components/ui/atoms';
import { Alert } from '@/components/ui/molecules';
import { updateWorkflowAction } from '@/app/actions/workflows';
import type {
  Workflow,
  WorkflowTriggerOn,
} from '@/lib/core/ports/workflow.repository';
import type { GabTable } from '@/lib/core/ports/table.repository';
import type { GabField } from '@/lib/core/ports/field.repository';
import type { GabAppRole } from '@/lib/core/ports/app-role.repository';
import { NodePalette } from './_components/NodePalette';
import { NodeConfigPanel } from './_components/NodeConfigPanel';
import { WorkflowCanvas } from './_components/WorkflowCanvas';
import { TestWorkflowDialog } from './_components/TestWorkflowDialog';
import {
  deserialize,
  serialize,
  type WorkflowNode,
  type WorkflowNodeData,
} from './serializer';

export interface WorkflowBuilderProps {
  appId: string;
  workflow: Workflow;
  tables: GabTable[];
  fields: GabField[];
  roles: GabAppRole[];
}

export function WorkflowBuilder({
  appId,
  workflow,
  tables,
  fields,
  roles,
}: Readonly<WorkflowBuilderProps>) {
  const router = useRouter();
  const cfg = useMemo(() => workflow.config ?? {}, [workflow.config]);

  const triggerTable = useMemo(
    () => tables.find((t) => t.id === cfg.triggerTableId),
    [tables, cfg.triggerTableId],
  );

  const initial = useMemo(
    () => deserialize(cfg, triggerTable?.name),
    [cfg, triggerTable?.name],
  );

  const [name, setName] = useState(workflow.name ?? '');
  const [triggerTableId, setTriggerTableId] = useState(cfg.triggerTableId ?? '');
  const [triggerOn, setTriggerOn] = useState<WorkflowTriggerOn>(cfg.triggerOn ?? 'create');
  const [active, setActive] = useState(workflow.active ?? false);
  const [nodes, setNodes] = useState<Node[]>(initial.nodes);
  const [edges, setEdges] = useState<Edge[]>(initial.edges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!savedAt) return;
    const t = setTimeout(() => setSavedAt(null), 2500);
    return () => clearTimeout(t);
  }, [savedAt]);

  const markDirty = useCallback(() => setDirty(true), []);

  const handleNodesChange = useCallback(
    (next: Node[]) => {
      setNodes(next);
      markDirty();
    },
    [markDirty],
  );

  const handleEdgesChange = useCallback(
    (next: Edge[]) => {
      setEdges(next);
      markDirty();
    },
    [markDirty],
  );

  const handleAddNode = useCallback(
    (type: string, stepType: string) => {
      const maxY = nodes.reduce((m, n) => Math.max(m, n.position.y), 0);
      const id = `step-${Date.now()}`;
      const newNode: Node<WorkflowNodeData> = {
        id,
        type,
        position: { x: 320, y: maxY + 120 },
        data: {
          label: stepType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          stepType,
          role: stepType === 'approval_gate' ? roles[0]?.name ?? 'Manager' : 'System',
          config: {},
        },
      };
      const nextNodes = [...nodes, newNode];
      let nextEdges = edges;
      if (selectedNode) {
        nextEdges = [
          ...edges,
          {
            id: `e-${selectedNode.id}-${id}-${Date.now()}`,
            source: selectedNode.id,
            target: id,
            animated: true,
          },
        ];
      }
      setNodes(nextNodes);
      setEdges(nextEdges);
      markDirty();
    },
    [nodes, edges, selectedNode, roles, markDirty],
  );

  const handleNodeUpdate = useCallback(
    (nodeId: string, updates: Partial<WorkflowNodeData>) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, ...updates } as WorkflowNodeData }
            : n,
        ),
      );
      setSelectedNode((current) =>
        current?.id === nodeId
          ? { ...current, data: { ...current.data, ...updates } as WorkflowNodeData }
          : current,
      );
      markDirty();
    },
    [markDirty],
  );

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
      if (selectedNode?.id === nodeId) setSelectedNode(null);
      markDirty();
    },
    [selectedNode, markDirty],
  );

  const onSave = () => {
    setError(null);
    const config = serialize(nodes as WorkflowNode[], edges, triggerTableId, triggerOn);
    startTransition(async () => {
      const res = await updateWorkflowAction(appId, workflow.id, {
        name,
        config,
        active,
      });
      if (!res.success) {
        setError(res.error ?? 'Failed to save workflow.');
        return;
      }
      setDirty(false);
      setSavedAt(Date.now());
    });
  };

  const onDiscard = () => {
    setName(workflow.name ?? '');
    setTriggerTableId(cfg.triggerTableId ?? '');
    setTriggerOn(cfg.triggerOn ?? 'create');
    setActive(workflow.active ?? false);
    setNodes(initial.nodes);
    setEdges(initial.edges);
    setSelectedNode(null);
    setError(null);
    setDirty(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[560px]">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Link
          href={`/apps/${appId}/workflows`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="h-6 w-px bg-border" />
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            markDirty();
          }}
          placeholder="Workflow name"
          aria-label="Workflow name"
          className="w-56 font-semibold"
        />
        <Select
          value={triggerTableId}
          onChange={(e) => {
            setTriggerTableId(e.target.value);
            markDirty();
          }}
          aria-label="Trigger table"
          className="w-48"
        >
          <option value="">Select trigger table…</option>
          {tables.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Select
          value={triggerOn}
          onChange={(e) => {
            setTriggerOn(e.target.value as WorkflowTriggerOn);
            markDirty();
          }}
          aria-label="Trigger event"
          className="w-32"
        >
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="any">Any</option>
        </Select>
        <div className="flex items-center gap-2">
          <Switch
            checked={active}
            onCheckedChange={(v) => {
              setActive(v);
              markDirty();
            }}
            aria-label="Workflow active"
          />
          <Text size="xs" weight="medium" className="text-foreground">
            {active ? 'Active' : 'Inactive'}
          </Text>
        </div>
        <div className="flex-1" />
        {savedAt ? (
          <Text size="xs" className="text-success-text">
            Saved
          </Text>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => router.push(`/apps/${appId}/workflows/${workflow.id}/runs`)}
          className="gap-1"
        >
          <History className="h-3.5 w-3.5" />
          Runs
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setTestOpen(true)}
          disabled={!triggerTableId}
          className="gap-1"
        >
          <PlayCircle className="h-3.5 w-3.5" />
          Test
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onDiscard}
          disabled={!dirty || isPending}
          className="gap-1"
        >
          <Undo2 className="h-3.5 w-3.5" />
          Discard
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={!dirty || isPending || !name.trim()}
          className="gap-1"
        >
          <Save className="h-3.5 w-3.5" />
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>

      {error ? (
        <div className="border-b border-border bg-card px-4 py-2">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      <div className="flex flex-1 min-h-0">
        <NodePalette onAddNode={handleAddNode} />
        <WorkflowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onNodeSelect={setSelectedNode}
        />
        <NodeConfigPanel
          open={selectedNode !== null}
          onClose={() => setSelectedNode(null)}
          node={
            selectedNode
              ? { id: selectedNode.id, data: selectedNode.data as unknown as WorkflowNodeData }
              : null
          }
          onUpdate={handleNodeUpdate}
          onDelete={handleNodeDelete}
          fields={fields}
          tables={tables}
          roles={roles}
        />
      </div>

      <TestWorkflowDialog
        open={testOpen}
        onOpenChange={setTestOpen}
        appId={appId}
        workflowId={workflow.id}
        triggerTableId={triggerTableId || null}
        triggerOn={triggerOn}
        tables={tables}
      />
    </div>
  );
}

export default WorkflowBuilder;
