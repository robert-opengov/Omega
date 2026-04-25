import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { NodeConfigPanel } from '../_components/NodeConfigPanel';
import type { WorkflowNodeData } from '../serializer';
import type { GabField } from '@/lib/core/ports/field.repository';
import type { GabTable } from '@/lib/core/ports/table.repository';
import type { GabAppRole } from '@/lib/core/ports/app-role.repository';

const FIELDS: GabField[] = [
  {
    id: 'f1',
    tableId: 't1',
    key: 'status',
    name: 'Status',
    type: 'text',
    required: false,
    sortOrder: 0,
    isSystem: false,
    createdAt: '2026-01-01',
  },
  {
    id: 'f2',
    tableId: 't1',
    key: 'priority',
    name: 'Priority',
    type: 'text',
    required: false,
    sortOrder: 1,
    isSystem: false,
    createdAt: '2026-01-01',
  },
];

const TABLES: GabTable[] = [
  { id: 't1', key: 'tasks', name: 'Tasks', appId: 'a1' },
  { id: 't2', key: 'projects', name: 'Projects', appId: 'a1' },
];

const ROLES: GabAppRole[] = [
  { id: 'r1', name: 'Manager', description: null, isSystem: false, createdAt: '2026-01-01' },
];

function makeNode(stepType: string, config: Record<string, unknown> = {}): {
  id: string;
  data: WorkflowNodeData;
} {
  return {
    id: 'n1',
    data: { label: 'Test', stepType, role: 'System', config },
  };
}

describe('NodeConfigPanel', () => {
  it('renders condition config for condition node', () => {
    const onUpdate = vi.fn();
    render(
      <NodeConfigPanel
        open
        onClose={() => {}}
        node={makeNode('condition', { field: '', operator: 'eq', value: '' })}
        onUpdate={onUpdate}
        onDelete={() => {}}
        fields={FIELDS}
        tables={TABLES}
        roles={ROLES}
      />,
    );
    expect(screen.getByLabelText('Condition field')).toBeInTheDocument();
    expect(screen.getByLabelText('Condition operator')).toBeInTheDocument();
    expect(screen.getByLabelText('Condition value')).toBeInTheDocument();
  });

  it('emits config update when condition field changes', () => {
    const onUpdate = vi.fn();
    render(
      <NodeConfigPanel
        open
        onClose={() => {}}
        node={makeNode('condition', { operator: 'eq' })}
        onUpdate={onUpdate}
        onDelete={() => {}}
        fields={FIELDS}
        tables={TABLES}
        roles={ROLES}
      />,
    );
    fireEvent.change(screen.getByLabelText('Condition field'), { target: { value: 'Status' } });
    expect(onUpdate).toHaveBeenCalledWith(
      'n1',
      expect.objectContaining({
        config: expect.objectContaining({ field: 'Status' }),
      }),
    );
  });

  it('switches drawer fields when node type changes', () => {
    const onUpdate = vi.fn();
    const { rerender } = render(
      <NodeConfigPanel
        open
        onClose={() => {}}
        node={makeNode('condition')}
        onUpdate={onUpdate}
        onDelete={() => {}}
        fields={FIELDS}
        tables={TABLES}
        roles={ROLES}
      />,
    );
    expect(screen.getByLabelText('Condition field')).toBeInTheDocument();

    rerender(
      <NodeConfigPanel
        open
        onClose={() => {}}
        node={makeNode('approval_gate')}
        onUpdate={onUpdate}
        onDelete={() => {}}
        fields={FIELDS}
        tables={TABLES}
        roles={ROLES}
      />,
    );
    expect(screen.getByLabelText('Assigned role')).toBeInTheDocument();
    expect(screen.getByLabelText('Approval prompt')).toBeInTheDocument();
    expect(screen.getByLabelText('On reject behavior')).toBeInTheDocument();
  });

  it('shows webhook fields for call_webhook step', () => {
    render(
      <NodeConfigPanel
        open
        onClose={() => {}}
        node={makeNode('call_webhook', { method: 'POST', body_template: '{}' })}
        onUpdate={() => {}}
        onDelete={() => {}}
        fields={FIELDS}
        tables={TABLES}
        roles={ROLES}
      />,
    );
    expect(screen.getByLabelText('Webhook URL')).toBeInTheDocument();
    expect(screen.getByLabelText('HTTP method')).toBeInTheDocument();
    expect(screen.getByLabelText('Body template')).toBeInTheDocument();
  });

  it('renders update_field config and emits change', () => {
    const onUpdate = vi.fn();
    render(
      <NodeConfigPanel
        open
        onClose={() => {}}
        node={makeNode('update_field', { recordId: 'trigger', fieldName: '', value: '' })}
        onUpdate={onUpdate}
        onDelete={() => {}}
        fields={FIELDS}
        tables={TABLES}
        roles={ROLES}
      />,
    );
    fireEvent.change(screen.getByLabelText('Field to update'), { target: { value: 'Priority' } });
    expect(onUpdate).toHaveBeenCalledWith(
      'n1',
      expect.objectContaining({
        config: expect.objectContaining({ fieldName: 'Priority' }),
      }),
    );
  });

  it('hides label input and renderer for trigger node', () => {
    render(
      <NodeConfigPanel
        open
        onClose={() => {}}
        node={makeNode('trigger')}
        onUpdate={() => {}}
        onDelete={() => {}}
        fields={FIELDS}
        tables={TABLES}
        roles={ROLES}
      />,
    );
    expect(screen.queryByLabelText('Node label')).not.toBeInTheDocument();
    expect(screen.getByText(/Trigger configuration/i)).toBeInTheDocument();
  });

  it('invokes onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(
      <NodeConfigPanel
        open
        onClose={() => {}}
        node={makeNode('condition')}
        onUpdate={() => {}}
        onDelete={onDelete}
        fields={FIELDS}
        tables={TABLES}
        roles={ROLES}
      />,
    );
    const dialog = screen.getByRole('dialog');
    const deleteBtn = within(dialog).getByLabelText('Delete node');
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith('n1');
  });
});
