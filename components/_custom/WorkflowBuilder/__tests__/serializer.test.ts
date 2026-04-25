import { describe, expect, it } from 'vitest';
import type { Edge } from '@xyflow/react';
import { deserialize, serialize, type WorkflowNode } from '../serializer';
import type { WorkflowConfig } from '@/lib/core/ports/workflow.repository';

function makeConfig(overrides: Partial<WorkflowConfig> = {}): WorkflowConfig {
  return {
    triggerTableId: 'table-1',
    triggerOn: 'create',
    steps: [],
    ...overrides,
  };
}

describe('deserialize', () => {
  it('generates trigger and end nodes for empty config', () => {
    const { nodes, edges } = deserialize(makeConfig());
    expect(nodes).toHaveLength(2);
    expect(nodes[0].type).toBe('trigger');
    expect(nodes[1].type).toBe('end');
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('trigger');
    expect(edges[0].target).toBe('end');
  });

  it('creates nodes for each step', () => {
    const config = makeConfig({
      steps: [
        { id: 's1', type: 'condition', config: { field: 'Status', operator: 'eq', value: 'Open' } },
        { id: 's2', type: 'update_field', config: { fieldName: 'Priority' } },
      ],
    });
    const { nodes, edges } = deserialize(config);
    expect(nodes).toHaveLength(4);
    expect(nodes[0].type).toBe('trigger');
    expect(nodes[1].type).toBe('condition');
    expect(nodes[2].type).toBe('action');
    expect(nodes[3].type).toBe('end');
    expect(edges).toHaveLength(3);
  });

  it('maps approval_gate to approval node type', () => {
    const config = makeConfig({
      steps: [{ id: 's1', type: 'approval_gate', config: { role: 'Manager' } }],
    });
    const { nodes } = deserialize(config);
    const approval = nodes.find((n) => n.id === 's1');
    expect(approval?.type).toBe('approval');
    expect(approval?.data.role).toBe('Manager');
  });

  it('uses saved layout when available', () => {
    const savedNodes: WorkflowNode[] = [
      {
        id: 'custom-1',
        type: 'trigger',
        position: { x: 100, y: 200 },
        data: { label: 'Start', stepType: 'trigger', role: 'System', config: {} },
      },
    ];
    const savedEdges: Edge[] = [];
    const config = makeConfig({
      layout: { nodes: savedNodes, edges: savedEdges } as Record<string, unknown>,
    });
    const { nodes, edges } = deserialize(config);
    expect(nodes).toEqual(savedNodes);
    expect(edges).toEqual(savedEdges);
  });

  it('generates stepLabel for condition nodes', () => {
    const config = makeConfig({
      steps: [{ id: 's1', type: 'condition', config: { field: 'Status', operator: 'eq', value: 'Open' } }],
    });
    const { nodes } = deserialize(config);
    const cond = nodes.find((n) => n.id === 's1');
    expect(cond?.data.label).toContain('Status');
    expect(cond?.data.label).toContain('eq');
  });

  it('generates stepLabel for webhook nodes', () => {
    const config = makeConfig({
      steps: [{ id: 's1', type: 'call_webhook', config: { method: 'PUT' } }],
    });
    const { nodes } = deserialize(config);
    const webhook = nodes.find((n) => n.id === 's1');
    expect(webhook?.data.label).toContain('PUT');
  });

  it('uses triggerTableName in trigger label', () => {
    const { nodes } = deserialize(makeConfig(), 'Orders');
    expect(nodes[0].data.label).toContain('Orders');
  });
});

describe('serialize', () => {
  it('round-trips through deserialize → serialize', () => {
    const original = makeConfig({
      steps: [
        { id: 's1', type: 'condition', config: { field: 'Status', operator: 'eq', value: 'Active' } },
        { id: 's2', type: 'update_field', config: { fieldName: 'Score', value: '10' } },
      ],
    });
    const { nodes, edges } = deserialize(original);
    const result = serialize(nodes, edges);

    expect(result.triggerTableId).toBe('table-1');
    expect(result.triggerOn).toBe('create');
    expect(result.steps!).toHaveLength(2);
    expect(result.steps![0].id).toBe('s1');
    expect(result.steps![0].type).toBe('condition');
    expect(result.steps![1].id).toBe('s2');
    expect(result.steps![1].type).toBe('update_field');
  });

  it('preserves step ordering from edges', () => {
    const nodes: WorkflowNode[] = [
      {
        id: 'trigger',
        type: 'trigger',
        position: { x: 0, y: 0 },
        data: {
          label: 'Start',
          stepType: 'trigger',
          role: 'System',
          config: { triggerTableId: 't1', triggerOn: 'create' },
        },
      },
      {
        id: 'b',
        type: 'action',
        position: { x: 0, y: 240 },
        data: { label: 'Step B', stepType: 'update_field', role: 'System', config: {} },
      },
      {
        id: 'a',
        type: 'condition',
        position: { x: 0, y: 120 },
        data: { label: 'Step A', stepType: 'condition', role: 'System', config: {} },
      },
      {
        id: 'end',
        type: 'end',
        position: { x: 0, y: 360 },
        data: { label: 'End', stepType: 'end', role: 'System', config: {} },
      },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'trigger', target: 'a' },
      { id: 'e2', source: 'a', target: 'b' },
      { id: 'e3', source: 'b', target: 'end' },
    ];
    const result = serialize(nodes, edges);
    expect(result.steps![0].id).toBe('a');
    expect(result.steps![1].id).toBe('b');
  });

  it('excludes trigger and end from steps', () => {
    const { nodes, edges } = deserialize(
      makeConfig({
        steps: [{ id: 's1', type: 'create_record', config: {} }],
      }),
    );
    const result = serialize(nodes, edges);
    const stepIds = result.steps!.map((s) => s.id);
    expect(stepIds).not.toContain('trigger');
    expect(stepIds).not.toContain('end');
  });

  it('saves layout in output', () => {
    const { nodes, edges } = deserialize(makeConfig());
    const result = serialize(nodes, edges);
    expect(result.layout).toBeDefined();
    expect((result.layout as { nodes: unknown[] }).nodes).toEqual(nodes);
  });

  it('uses provided triggerTableId and triggerOn overrides', () => {
    const { nodes, edges } = deserialize(makeConfig());
    const result = serialize(nodes, edges, 'override-table', 'update');
    expect(result.triggerTableId).toBe('override-table');
    expect(result.triggerOn).toBe('update');
  });

  it('handles disconnected nodes', () => {
    const nodes: WorkflowNode[] = [
      {
        id: 'trigger',
        type: 'trigger',
        position: { x: 0, y: 0 },
        data: {
          label: 'Start',
          stepType: 'trigger',
          role: 'System',
          config: { triggerTableId: 't1', triggerOn: 'create' },
        },
      },
      {
        id: 'orphan',
        type: 'action',
        position: { x: 200, y: 200 },
        data: { label: 'Orphan', stepType: 'create_record', role: 'System', config: {} },
      },
      {
        id: 'end',
        type: 'end',
        position: { x: 0, y: 360 },
        data: { label: 'End', stepType: 'end', role: 'System', config: {} },
      },
    ];
    const edges: Edge[] = [{ id: 'e1', source: 'trigger', target: 'end' }];
    const result = serialize(nodes, edges);
    expect(result.steps!).toHaveLength(1);
    expect(result.steps![0].id).toBe('orphan');
  });

  it('preserves branching at a condition node', () => {
    const nodes: WorkflowNode[] = [
      {
        id: 'trigger',
        type: 'trigger',
        position: { x: 0, y: 0 },
        data: { label: 'Start', stepType: 'trigger', role: 'System', config: {} },
      },
      {
        id: 'cond',
        type: 'condition',
        position: { x: 0, y: 120 },
        data: { label: 'C', stepType: 'condition', role: 'System', config: {} },
      },
      {
        id: 'yes',
        type: 'action',
        position: { x: -100, y: 240 },
        data: { label: 'Yes', stepType: 'update_field', role: 'System', config: {} },
      },
      {
        id: 'no',
        type: 'action',
        position: { x: 100, y: 240 },
        data: { label: 'No', stepType: 'send_notification', role: 'System', config: {} },
      },
      {
        id: 'end',
        type: 'end',
        position: { x: 0, y: 360 },
        data: { label: 'End', stepType: 'end', role: 'System', config: {} },
      },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'trigger', target: 'cond' },
      { id: 'e2', source: 'cond', sourceHandle: 'yes', target: 'yes' },
      { id: 'e3', source: 'cond', sourceHandle: 'no', target: 'no' },
      { id: 'e4', source: 'yes', target: 'end' },
      { id: 'e5', source: 'no', target: 'end' },
    ];
    const result = serialize(nodes, edges);
    const stepIds = result.steps!.map((s) => s.id);
    expect(stepIds).toContain('cond');
    expect(stepIds).toContain('yes');
    expect(stepIds).toContain('no');
    expect(stepIds[0]).toBe('cond');
  });
});
