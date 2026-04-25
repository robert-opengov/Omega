/**
 * Workflow serializer — vendored 1:1 from GAB Core
 * (apps/web/src/features/workflow-builder/serializer.ts) so that a workflow
 * config saved by Omega round-trips cleanly through GAB Core's editor and
 * vice-versa. Tests are vendored alongside.
 */

import type { Edge, Node } from '@xyflow/react';
import type {
  WorkflowConfig,
  WorkflowStep,
  WorkflowStepType,
} from '@/lib/core/ports/workflow.repository';

export interface WorkflowNodeData {
  label: string;
  stepType: string;
  role: string;
  config: Record<string, unknown>;
  [key: string]: unknown;
}

export type WorkflowNode = Node<WorkflowNodeData>;

const STEP_TYPE_TO_NODE: Record<string, string> = {
  condition: 'condition',
  create_record: 'action',
  update_field: 'action',
  send_notification: 'action',
  call_webhook: 'action',
  approval_gate: 'approval',
};

function stepLabel(step: WorkflowStep): string {
  const cfg = step.config ?? {};
  switch (step.type) {
    case 'condition': {
      const field = (cfg.field as string) ?? '';
      const op = (cfg.operator as string) ?? '';
      const val = (cfg.value as string) ?? '';
      return field ? `If ${field} ${op} ${val}` : 'Condition';
    }
    case 'create_record':
      return 'Create Record';
    case 'update_field':
      return `Update ${(cfg.fieldName as string) ?? 'Field'}`;
    case 'send_notification':
      return 'Send Notification';
    case 'call_webhook':
      return `${(cfg.method as string) ?? 'POST'} Webhook`;
    case 'approval_gate':
      return `${(cfg.role as string) ?? ''} Approval`;
    default:
      return step.type;
  }
}

export function deserialize(
  config: WorkflowConfig,
  triggerTableName?: string,
): { nodes: WorkflowNode[]; edges: Edge[] } {
  const layout = config.layout as
    | { nodes?: WorkflowNode[]; edges?: Edge[] }
    | undefined;
  if (layout?.nodes?.length) {
    return { nodes: layout.nodes, edges: layout.edges ?? [] };
  }

  const steps = config.steps ?? [];
  const nodes: WorkflowNode[] = [];
  const edges: Edge[] = [];

  const triggerNode: WorkflowNode = {
    id: 'trigger',
    type: 'trigger',
    position: { x: 300, y: 40 },
    data: {
      label: `${triggerTableName ?? 'Table'} — on ${config.triggerOn ?? 'create'}`,
      stepType: 'trigger',
      role: 'System',
      config: {
        triggerTableId: config.triggerTableId,
        triggerOn: config.triggerOn,
      },
    },
  };
  nodes.push(triggerNode);

  let prevId = 'trigger';
  const Y_SPACING = 120;

  steps.forEach((step, i) => {
    const nodeType = STEP_TYPE_TO_NODE[step.type] ?? 'action';
    const role =
      step.type === 'approval_gate'
        ? ((step.config?.role as string) ?? 'Manager')
        : 'System';
    const node: WorkflowNode = {
      id: step.id,
      type: nodeType,
      position: { x: 300, y: 40 + (i + 1) * Y_SPACING },
      data: {
        label: stepLabel(step),
        stepType: step.type,
        role,
        config: step.config ?? {},
      },
    };
    nodes.push(node);

    edges.push({
      id: `e-${prevId}-${step.id}`,
      source: prevId,
      target: step.id,
      sourceHandle:
        step.type === 'condition' && i > 0 ? 'yes' : undefined,
      animated: true,
    });

    prevId = step.id;
  });

  const endNode: WorkflowNode = {
    id: 'end',
    type: 'end',
    position: { x: 300, y: 40 + (steps.length + 1) * Y_SPACING },
    data: { label: 'End', stepType: 'end', role: 'System', config: {} },
  };
  nodes.push(endNode);
  edges.push({
    id: `e-${prevId}-end`,
    source: prevId,
    target: 'end',
    animated: true,
  });

  return { nodes, edges };
}

export function serialize(
  nodes: WorkflowNode[],
  edges: Edge[],
  triggerTableId?: string,
  triggerOn?: string,
): WorkflowConfig {
  const triggerNode = nodes.find((n) => n.type === 'trigger');
  const stepNodes = nodes.filter(
    (n) => n.type !== 'trigger' && n.type !== 'end',
  );

  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    adjacency.get(edge.source)!.push(edge.target);
  }

  const ordered: WorkflowNode[] = [];
  const visited = new Set<string>();

  function walk(nodeId: string) {
    if (visited.has(nodeId) || nodeId === 'end') return;
    visited.add(nodeId);
    const node = stepNodes.find((n) => n.id === nodeId);
    if (node) ordered.push(node);
    const children = adjacency.get(nodeId) ?? [];
    for (const c of children) walk(c);
  }

  const startId = triggerNode?.id ?? 'trigger';
  const firstChildren = adjacency.get(startId) ?? [];
  for (const c of firstChildren) walk(c);

  for (const n of stepNodes) {
    if (!visited.has(n.id)) ordered.push(n);
  }

  const steps: WorkflowStep[] = ordered.map((n) => ({
    id: n.id,
    type: (n.data.stepType ?? 'condition') as WorkflowStepType,
    config: n.data.config ?? {},
  }));

  const resolvedTriggerTableId =
    triggerTableId ??
    (triggerNode?.data.config?.triggerTableId as string) ??
    '';
  const resolvedTriggerOn = (triggerOn ??
    (triggerNode?.data.config?.triggerOn as string) ??
    'create') as WorkflowConfig['triggerOn'];

  return {
    triggerTableId: resolvedTriggerTableId,
    triggerOn: resolvedTriggerOn,
    steps,
    layout: { nodes, edges },
  };
}
