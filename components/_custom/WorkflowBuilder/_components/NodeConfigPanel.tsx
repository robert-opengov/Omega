'use client';

import { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Select, Text, Textarea } from '@/components/ui/atoms';
import { FormField, Sheet } from '@/components/ui/molecules';
import { FieldRefPicker } from './FieldRefPicker';
import type { WorkflowNodeData } from '../serializer';
import type { GabField } from '@/lib/core/ports/field.repository';
import type { GabTable } from '@/lib/core/ports/table.repository';
import type { GabAppRole } from '@/lib/core/ports/app-role.repository';

const OPERATORS: { value: string; label: string }[] = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equals' },
  { value: 'gt', label: 'greater than' },
  { value: 'gte', label: 'greater or equal' },
  { value: 'lt', label: 'less than' },
  { value: 'lte', label: 'less or equal' },
  { value: 'contains', label: 'contains' },
  { value: 'in', label: 'in list' },
];

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export interface NodeConfigPanelProps {
  open: boolean;
  onClose: () => void;
  node: { id: string; data: WorkflowNodeData } | null;
  onUpdate: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  onDelete: (nodeId: string) => void;
  fields: GabField[];
  tables: GabTable[];
  roles: GabAppRole[];
}

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface FieldRefInputProps {
  value: string;
  onChange: (next: string) => void;
  fields: GabField[];
  placeholder?: string;
  ariaLabel?: string;
}

function FieldRefInput({ value, onChange, fields, placeholder, ariaLabel }: Readonly<FieldRefInputProps>) {
  return (
    <div className="flex items-center gap-1">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="flex-1"
      />
      <FieldRefPicker
        fields={fields}
        onInsert={(ref) => onChange(value + ref)}
      />
    </div>
  );
}

export function NodeConfigPanel({
  open,
  onClose,
  node,
  onUpdate,
  onDelete,
  fields,
  tables,
  roles,
}: Readonly<NodeConfigPanelProps>) {
  const cfg = useMemo(() => node?.data?.config ?? {}, [node]);

  if (!node) {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && onClose()} title="Node config" size="lg" modal={false}>
        <div className="py-4">
          <Text size="sm" color="muted">Select a node to configure it.</Text>
        </div>
      </Sheet>
    );
  }

  const d = node.data;

  const updateConfig = (updates: Record<string, unknown>) => {
    onUpdate(node.id, { config: { ...cfg, ...updates } });
  };

  const updateLabel = (label: string) => {
    onUpdate(node.id, { label });
  };

  const renderConditionConfig = () => (
    <div className="space-y-3">
      <FormField label="Field">
        <Select
          value={(cfg.field as string) ?? ''}
          onChange={(e) => updateConfig({ field: e.target.value })}
          aria-label="Condition field"
        >
          <option value="">Select field…</option>
          {fields.map((f) => (
            <option key={f.id} value={f.name}>
              {f.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Operator">
        <Select
          value={(cfg.operator as string) ?? 'eq'}
          onChange={(e) => updateConfig({ operator: e.target.value })}
          aria-label="Condition operator"
        >
          {OPERATORS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Value">
        <FieldRefInput
          value={(cfg.value as string) ?? ''}
          onChange={(v) => updateConfig({ value: v })}
          fields={fields}
          placeholder="Compare against…"
          ariaLabel="Condition value"
        />
      </FormField>
    </div>
  );

  const renderUpdateFieldConfig = () => (
    <div className="space-y-3">
      <FormField label="Record">
        <Select
          value={(cfg.recordId as string) ?? 'trigger'}
          onChange={(e) => updateConfig({ recordId: e.target.value })}
          aria-label="Target record"
        >
          <option value="trigger">Trigger record</option>
          <option value="__created">Last created record</option>
        </Select>
      </FormField>
      <FormField label="Field">
        <Select
          value={(cfg.fieldName as string) ?? ''}
          onChange={(e) => updateConfig({ fieldName: e.target.value })}
          aria-label="Field to update"
        >
          <option value="">Select field…</option>
          {fields.map((f) => (
            <option key={f.id} value={f.name}>
              {f.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Value">
        <FieldRefInput
          value={(cfg.value as string) ?? ''}
          onChange={(v) => updateConfig({ value: v })}
          fields={fields}
          placeholder="New value…"
          ariaLabel="New field value"
        />
      </FormField>
    </div>
  );

  const renderCreateRecordConfig = () => {
    const targetTableId = (cfg.tableId as string) ?? '';
    const data = (cfg.data as Record<string, string>) ?? {};
    const entries = Object.entries(data);

    const setData = (key: string, value: string) => {
      updateConfig({ data: { ...data, [key]: value } });
    };
    const removeKey = (key: string) => {
      const next = { ...data };
      delete next[key];
      updateConfig({ data: next });
    };
    const addKey = () => {
      const newKey = `field_${entries.length + 1}`;
      setData(newKey, '');
    };

    return (
      <div className="space-y-3">
        <FormField label="Target table">
          <Select
            value={targetTableId}
            onChange={(e) => updateConfig({ tableId: e.target.value, data: {} })}
            aria-label="Target table"
          >
            <option value="">Select table…</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </FormField>
        {targetTableId ? (
          <div className="space-y-2">
            <Text size="xs" weight="bold" color="muted" className="block uppercase tracking-wider">
              Field mappings
            </Text>
            {entries.length === 0 ? (
              <Text size="xs" color="muted">No fields mapped yet.</Text>
            ) : null}
            {entries.map(([key, val]) => (
              <div key={key} className="flex items-start gap-1.5">
                <Input
                  value={key}
                  onChange={(e) => {
                    removeKey(key);
                    setData(e.target.value, val);
                  }}
                  placeholder="Field key"
                  aria-label="Field key"
                  className="flex-1 text-xs"
                />
                <Input
                  value={val}
                  onChange={(e) => setData(key, e.target.value)}
                  placeholder="Value or [Field]"
                  aria-label="Field value"
                  className="flex-1 text-xs"
                />
                <FieldRefPicker
                  fields={fields}
                  onInsert={(ref) => setData(key, val + ref)}
                />
                <button
                  type="button"
                  onClick={() => removeKey(key)}
                  aria-label={`Remove ${key}`}
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addKey}
              className="gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add field
            </Button>
          </div>
        ) : null}
      </div>
    );
  };

  const renderNotificationConfig = () => (
    <div className="space-y-3">
      <FormField label="Recipient role">
        <Select
          value={(cfg.role as string) ?? ''}
          onChange={(e) => updateConfig({ role: e.target.value })}
          aria-label="Recipient role"
        >
          <option value="">Select role…</option>
          {roles.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Subject">
        <FieldRefInput
          value={(cfg.subject as string) ?? ''}
          onChange={(v) => updateConfig({ subject: v })}
          fields={fields}
          placeholder="Notification subject…"
          ariaLabel="Subject template"
        />
      </FormField>
      <FormField label="Body">
        <Textarea
          value={(cfg.body as string) ?? ''}
          onChange={(e) => updateConfig({ body: e.target.value })}
          rows={4}
          aria-label="Body template"
          placeholder="Use [Field] tokens to interpolate values."
        />
      </FormField>
    </div>
  );

  const renderWebhookConfig = () => (
    <div className="space-y-3">
      <FormField label="URL">
        <FieldRefInput
          value={(cfg.url as string) ?? ''}
          onChange={(v) => updateConfig({ url: v })}
          fields={fields}
          placeholder="https://example.com/hook"
          ariaLabel="Webhook URL"
        />
      </FormField>
      <FormField label="Method">
        <Select
          value={(cfg.method as string) ?? 'POST'}
          onChange={(e) => updateConfig({ method: e.target.value })}
          aria-label="HTTP method"
        >
          {HTTP_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Headers (JSON)">
        <Textarea
          value={(cfg.headers as string) ?? '{}'}
          onChange={(e) => updateConfig({ headers: e.target.value })}
          rows={3}
          className="font-mono text-xs"
          aria-label="Headers JSON"
        />
      </FormField>
      <FormField label="Body template">
        <Textarea
          value={(cfg.body_template as string) ?? '{}'}
          onChange={(e) => updateConfig({ body_template: e.target.value })}
          rows={4}
          className="font-mono text-xs"
          aria-label="Body template"
        />
      </FormField>
    </div>
  );

  const renderApprovalConfig = () => (
    <div className="space-y-3">
      <FormField label="Assigned role">
        <Select
          value={(cfg.role as string) ?? ''}
          onChange={(e) => {
            updateConfig({ role: e.target.value });
            onUpdate(node.id, { role: e.target.value });
          }}
          aria-label="Assigned role"
        >
          <option value="">Select role…</option>
          {roles.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Approval prompt">
        <Textarea
          value={(cfg.prompt as string) ?? ''}
          onChange={(e) => updateConfig({ prompt: e.target.value })}
          rows={3}
          aria-label="Approval prompt"
          placeholder="Question for the approver."
        />
      </FormField>
      <FormField label="On reject">
        <Select
          value={(cfg.onReject as string) ?? 'end'}
          onChange={(e) => updateConfig({ onReject: e.target.value })}
          aria-label="On reject behavior"
        >
          <option value="end">End workflow</option>
          <option value="continue">Continue anyway</option>
        </Select>
      </FormField>
    </div>
  );

  const RENDERERS: Record<string, () => React.ReactElement> = {
    condition: renderConditionConfig,
    create_record: renderCreateRecordConfig,
    update_field: renderUpdateFieldConfig,
    send_notification: renderNotificationConfig,
    call_webhook: renderWebhookConfig,
    approval_gate: renderApprovalConfig,
  };

  const renderer = RENDERERS[d.stepType];
  const isImmutable = d.stepType === 'trigger' || d.stepType === 'end';

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={titleCase(d.stepType)}
      size="lg"
      modal={false}
      headerActions={
        !isImmutable ? (
          <button
            type="button"
            onClick={() => onDelete(node.id)}
            aria-label="Delete node"
            className="inline-flex h-7 w-7 items-center justify-center rounded text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null
      }
    >
      <div className="space-y-4">
        {!isImmutable ? (
          <FormField label="Label">
            <Input
              value={d.label ?? ''}
              onChange={(e) => updateLabel(e.target.value)}
              aria-label="Node label"
            />
          </FormField>
        ) : null}
        {renderer ? (
          renderer()
        ) : (
          <Text size="sm" color="muted">
            {d.stepType === 'trigger'
              ? 'Trigger configuration is in the editor toolbar.'
              : 'No configuration available for this node type.'}
          </Text>
        )}
      </div>
    </Sheet>
  );
}

export default NodeConfigPanel;
