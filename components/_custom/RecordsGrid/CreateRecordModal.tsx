'use client';

import { useState } from 'react';
import { Button, Text, Textarea } from '@/components/ui/atoms';
import { FormField, Modal } from '@/components/ui/molecules';
import { isEditable } from './columns';
import type { GabField } from '@/lib/core/ports/field.repository';
import type { GabRow } from '@/lib/core/ports/data.repository';

export interface CreateRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: GabField[];
  /** Throw or return rejected promise to surface an error. */
  onSubmit: (values: GabRow) => Promise<void>;
}

export function CreateRecordModal({
  open,
  onOpenChange,
  fields,
  onSubmit,
}: CreateRecordModalProps) {
  const editableFields = fields
    .filter(isEditable)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const set = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  const submit = async () => {
    setError(null);
    const payload: GabRow = {};
    for (const field of editableFields) {
      const raw = values[field.key];
      if (raw === undefined || raw === '') {
        if (field.required) {
          setError(`${field.name} is required`);
          return;
        }
        continue;
      }
      try {
        payload[field.key] = parseValue(field, raw);
      } catch (err) {
        setError(`${field.name}: ${err instanceof Error ? err.message : 'invalid'}`);
        return;
      }
    }
    setPending(true);
    try {
      await onSubmit(payload);
      setValues({});
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create record');
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setError(null);
          setValues({});
        }
      }}
      title="New Record"
      description="Computed and system fields are populated automatically and not shown here."
      size="lg"
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {editableFields.length === 0 ? (
          <Text size="sm" color="muted">No editable fields on this table.</Text>
        ) : (
          editableFields.map((field) => (
            <FieldInput
              key={field.id}
              field={field}
              value={values[field.key] ?? ''}
              onChange={(v) => set(field.key, v)}
            />
          ))
        )}
        {error && <Text size="sm" className="text-danger-text">{error}</Text>}
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={submit}
          disabled={pending || editableFields.length === 0}
        >
          {pending ? 'Creating…' : 'Create Record'}
        </Button>
      </div>
    </Modal>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: GabField;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.type === 'boolean' || field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="accent-primary h-4 w-4 rounded"
          checked={value === 'true'}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
        />
        {field.name}
        {field.required && <span className="text-danger-text">*</span>}
      </label>
    );
  }

  if ((field.type === 'choice' || field.type === 'select') && field.config && typeof field.config === 'object') {
    const choices = (field.config as { choices?: Array<{ value: string; label?: string }> }).choices;
    if (Array.isArray(choices) && choices.length > 0) {
      return (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            {field.name}
            {field.required && <span className="text-danger-text ml-0.5">*</span>}
          </label>
          <select
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">—</option>
            {choices.map((c) => (
              <option key={c.value} value={c.value}>{c.label ?? c.value}</option>
            ))}
          </select>
        </div>
      );
    }
  }

  if (field.type === 'text' || field.type === 'json' || field.type === 'object') {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          {field.name}
          {field.required && <span className="text-danger-text ml-0.5">*</span>}
        </label>
        <Textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }

  return (
    <FormField
      label={field.name}
      required={field.required}
      type={inputType(field)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function inputType(field: GabField): string {
  switch (field.type) {
    case 'number':
    case 'integer':
    case 'decimal':
    case 'currency':
      return 'number';
    case 'date':
      return 'date';
    case 'datetime':
    case 'timestamp':
      return 'datetime-local';
    case 'email':
      return 'email';
    case 'url':
      return 'url';
    case 'phone':
      return 'tel';
    default:
      return 'text';
  }
}

function parseValue(field: GabField, raw: string): unknown {
  switch (field.type) {
    case 'boolean':
    case 'checkbox':
      return raw === 'true';
    case 'number':
    case 'decimal':
    case 'currency': {
      const n = Number(raw);
      if (Number.isNaN(n)) throw new Error('must be a number');
      return n;
    }
    case 'integer': {
      const n = Number(raw);
      if (!Number.isInteger(n)) throw new Error('must be an integer');
      return n;
    }
    case 'json':
    case 'object':
      try {
        return JSON.parse(raw);
      } catch {
        throw new Error('must be valid JSON');
      }
    default:
      return raw;
  }
}
