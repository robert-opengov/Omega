'use client';

import { useState } from 'react';
import { Button, Input, Label, Switch, Text, Textarea } from '@/components/ui/atoms';
import { TagInput } from '@/components/ui/molecules';
import type {
  CreateNotificationParams,
  GabNotification,
} from '@/lib/core/ports/notification.repository';

const TRIGGER_TYPES = [
  { value: 'on_create', label: 'On record create' },
  { value: 'on_update', label: 'On record update' },
  { value: 'on_delete', label: 'On record delete' },
  { value: 'on_field_change', label: 'On field change' },
  { value: 'date_based', label: 'Date-based' },
] as const;

const CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'in_app', label: 'In-app' },
] as const;

const RECIPIENT_TYPES = [
  { value: 'all_app_users', label: 'All app users' },
  { value: 'specific_users', label: 'Specific users' },
  { value: 'specific_roles', label: 'Specific roles' },
  { value: 'field_value', label: 'Field value' },
] as const;

interface NotificationEditorProps {
  tableId: string;
  initial?: GabNotification;
  isSaving: boolean;
  onSubmit: (values: CreateNotificationParams) => void;
  onCancel: () => void;
}

export function NotificationEditor({
  tableId,
  initial,
  isSaving,
  onSubmit,
  onCancel,
}: NotificationEditorProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [triggerType, setTriggerType] = useState(initial?.triggerType ?? 'on_create');
  const [channel, setChannel] = useState(initial?.channel ?? 'email');
  const [recipientType, setRecipientType] = useState(initial?.recipientType ?? 'all_app_users');
  const [subjectTemplate, setSubjectTemplate] = useState(initial?.subjectTemplate ?? '');
  const [bodyTemplate, setBodyTemplate] = useState(initial?.bodyTemplate ?? '');
  const [active, setActive] = useState<boolean>(initial?.active ?? true);

  const recipientUsers = (initial?.recipientConfig?.userIds as string[] | undefined) ?? [];
  const recipientRoles = (initial?.recipientConfig?.roleNames as string[] | undefined) ?? [];
  const recipientField = (initial?.recipientConfig?.fieldKey as string | undefined) ?? '';

  const [users, setUsers] = useState<string[]>(recipientUsers);
  const [roles, setRoles] = useState<string[]>(recipientRoles);
  const [fieldKey, setFieldKey] = useState<string>(recipientField);

  const dateFieldKey = (initial?.dateCondition?.fieldKey as string | undefined) ?? '';
  const dateOffsetDays = (initial?.dateCondition?.offsetDays as number | undefined) ?? 0;

  const [dateField, setDateField] = useState<string>(dateFieldKey);
  const [dateOffset, setDateOffset] = useState<number>(dateOffsetDays);

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    if (!name.trim()) return setError('Name is required.');
    if (!subjectTemplate.trim()) return setError('Subject is required.');
    if (!bodyTemplate.trim()) return setError('Body is required.');

    let recipientConfig: Record<string, unknown> = {};
    if (recipientType === 'specific_users') recipientConfig = { userIds: users };
    else if (recipientType === 'specific_roles') recipientConfig = { roleNames: roles };
    else if (recipientType === 'field_value') recipientConfig = { fieldKey };

    let dateCondition: Record<string, unknown> | null = null;
    if (triggerType === 'date_based' && dateField) {
      dateCondition = { fieldKey: dateField, offsetDays: dateOffset };
    }

    onSubmit({
      tableId,
      name: name.trim(),
      description: description.trim() || null,
      triggerType,
      channel,
      recipientType,
      subjectTemplate,
      bodyTemplate,
      recipientConfig,
      dateCondition,
      active,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ne-name">Name</Label>
          <Input id="ne-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ne-active">Active</Label>
          <div className="flex items-center gap-2 h-9">
            <Switch id="ne-active" checked={active} onCheckedChange={setActive} />
            <Text size="sm" color="muted">{active ? 'Enabled' : 'Disabled'}</Text>
          </div>
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="ne-desc">Description (optional)</Label>
          <Input id="ne-desc" value={description ?? ''} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ne-trigger">Trigger</Label>
          <select
            id="ne-trigger"
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value)}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          >
            {TRIGGER_TYPES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ne-channel">Channel</Label>
          <select
            id="ne-channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          >
            {CHANNELS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ne-recipient">Recipient</Label>
          <select
            id="ne-recipient"
            value={recipientType}
            onChange={(e) => setRecipientType(e.target.value)}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          >
            {RECIPIENT_TYPES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {recipientType === 'specific_users' && (
        <div className="space-y-1.5">
          <Label>User IDs</Label>
          <TagInput tags={users} onTagsChange={setUsers} placeholder="Add user ID" />
        </div>
      )}
      {recipientType === 'specific_roles' && (
        <div className="space-y-1.5">
          <Label>Role names</Label>
          <TagInput tags={roles} onTagsChange={setRoles} placeholder="Add role name" />
        </div>
      )}
      {recipientType === 'field_value' && (
        <div className="space-y-1.5">
          <Label htmlFor="ne-field-key">Field key (must contain email or user ID)</Label>
          <Input
            id="ne-field-key"
            value={fieldKey}
            onChange={(e) => setFieldKey(e.target.value)}
            placeholder="assignee_email"
          />
        </div>
      )}

      {triggerType === 'date_based' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border border-border rounded-md">
          <div className="space-y-1.5">
            <Label htmlFor="ne-date-field">Date field key</Label>
            <Input
              id="ne-date-field"
              value={dateField}
              onChange={(e) => setDateField(e.target.value)}
              placeholder="due_date"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ne-date-offset">Offset (days)</Label>
            <Input
              id="ne-date-offset"
              type="number"
              value={dateOffset}
              onChange={(e) => setDateOffset(Number(e.target.value))}
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="ne-subject">Subject template</Label>
        <Input
          id="ne-subject"
          value={subjectTemplate}
          onChange={(e) => setSubjectTemplate(e.target.value)}
          placeholder="New {{record.name}}"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ne-body">Body template</Label>
        <Textarea
          id="ne-body"
          rows={6}
          value={bodyTemplate}
          onChange={(e) => setBodyTemplate(e.target.value)}
          placeholder="Hello, a new {{record.name}} was created."
        />
      </div>

      {error && <Text size="sm" className="text-danger-text">{error}</Text>}

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
        <Button variant="ghost" onClick={onCancel} disabled={isSaving}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? 'Saving…' : initial ? 'Save changes' : 'Create notification'}
        </Button>
      </div>
    </div>
  );
}
