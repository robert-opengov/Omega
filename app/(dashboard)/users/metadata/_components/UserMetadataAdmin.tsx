'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Trash2, Save, Database } from 'lucide-react';
import { Button, Heading, Text } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Modal,
  PageHeader,
} from '@/components/ui/molecules';
import {
  createMetadataFieldAction,
  deleteMetadataFieldAction,
  patchUserMetadataAction,
} from '@/app/actions/user-metadata';
import { useToast } from '@/providers/toast-provider';
import type {
  MetadataField,
  UserMetadataFieldType,
} from '@/lib/core/ports/user-metadata.repository';
import { getUserMetadataAction } from './get-user-metadata.action';

const FIELD_TYPES: UserMetadataFieldType[] = [
  'text',
  'number',
  'select',
  'boolean',
  'date',
];

interface UserOption {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface UserMetadataAdminProps {
  apps: Array<{ id: string; name: string }>;
  selectedAppId: string;
  fields: MetadataField[];
  users: UserOption[];
}

export function UserMetadataAdmin({
  apps,
  selectedAppId,
  fields,
  users,
}: UserMetadataAdminProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [pending, startTransition] = useTransition();

  const [items, setItems] = useState<MetadataField[]>(fields);

  // New field dialog state
  const [openCreate, setOpenCreate] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<UserMetadataFieldType>('text');
  const [required, setRequired] = useState(false);
  const [optionsText, setOptionsText] = useState('');

  // Per-user values state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userMetadata, setUserMetadata] = useState<Record<string, unknown>>({});

  const onAppChange = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('appId', id);
    router.push(`/users/metadata?${params.toString()}`);
  };

  const handleLoadUser = (userId: string) => {
    setSelectedUserId(userId);
    if (!userId) {
      setUserMetadata({});
      return;
    }
    startTransition(async () => {
      const res = await getUserMetadataAction({
        appId: selectedAppId,
        userId,
      });
      if (res.success) {
        setUserMetadata(res.data.metadata ?? {});
      } else {
        addToast(`Could not load metadata: ${res.error}`, 'error');
      }
    });
  };

  const handleCreateField = () => {
    if (!fieldName.trim()) return;
    let parsedOptions: string[] | undefined;
    if (fieldType === 'select' && optionsText.trim()) {
      try {
        const parsed = JSON.parse(optionsText);
        parsedOptions = Array.isArray(parsed) ? parsed.map(String) : undefined;
      } catch {
        addToast('Options must be a JSON array of strings', 'error');
        return;
      }
    }
    startTransition(async () => {
      const res = await createMetadataFieldAction({
        appId: selectedAppId,
        fieldName: fieldName.trim(),
        fieldType,
        required,
        options: parsedOptions,
      });
      if (!res.success) {
        addToast(`Could not create field: ${res.error}`, 'error');
        return;
      }
      setItems((prev) => [...prev, res.data]);
      setFieldName('');
      setFieldType('text');
      setRequired(false);
      setOptionsText('');
      setOpenCreate(false);
      addToast('Field created', 'success');
    });
  };

  const handleDeleteField = (fieldId: string) => {
    if (!confirm('Delete this metadata field? This cannot be undone.')) return;
    startTransition(async () => {
      const res = await deleteMetadataFieldAction({
        appId: selectedAppId,
        fieldId,
      });
      if (!res.success) {
        addToast(`Delete failed: ${res.error}`, 'error');
        return;
      }
      setItems((prev) => prev.filter((f) => f.id !== fieldId));
      addToast('Field deleted', 'success');
    });
  };

  const handleSaveMetadata = () => {
    if (!selectedUserId) return;
    startTransition(async () => {
      const res = await patchUserMetadataAction({
        appId: selectedAppId,
        userId: selectedUserId,
        metadata: userMetadata,
      });
      if (!res.success) {
        addToast(`Save failed: ${res.error}`, 'error');
        return;
      }
      addToast('Metadata saved', 'success');
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User metadata"
        description="Define per-app metadata fields and edit per-user values."
        actions={
          <select
            value={selectedAppId}
            onChange={(e) => onAppChange(e.target.value)}
            className="rounded border border-border px-3 py-2 text-sm bg-background"
          >
            {apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Metadata fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setOpenCreate(true)} icon={Plus} size="sm">
              New field
            </Button>
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No metadata fields"
              description="Define a field above to extend user records for this app."
              size="medium"
            />
          ) : (
            <div className="border border-border rounded">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Name</th>
                    <th className="text-left px-3 py-2 font-medium">Type</th>
                    <th className="text-left px-3 py-2 font-medium">Required</th>
                    <th className="text-left px-3 py-2 font-medium">Options</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((f) => (
                    <tr key={f.id} className="border-t border-border">
                      <td className="px-3 py-2 font-medium">{f.fieldName}</td>
                      <td className="px-3 py-2">{f.fieldType}</td>
                      <td className="px-3 py-2">{f.required ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {f.options?.join(', ') ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          icon={Trash2}
                          disabled={pending}
                          onClick={() => handleDeleteField(f.id)}
                          aria-label={`Delete ${f.fieldName}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Per-user values</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <label htmlFor="user-select" className="text-sm font-medium">
              Edit values for:
            </label>
            <select
              id="user-select"
              value={selectedUserId ?? ''}
              onChange={(e) => handleLoadUser(e.target.value)}
              className="flex-1 rounded border border-border px-3 py-2 text-sm bg-background"
            >
              <option value="">— Select a user —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email})
                </option>
              ))}
            </select>
          </div>

          {selectedUserId && (
            <div className="space-y-3 pt-2">
              {items.length === 0 ? (
                <Text size="sm" color="muted">
                  Define metadata fields above to populate values.
                </Text>
              ) : (
                items.map((f) => (
                  <FieldEditor
                    key={f.id}
                    field={f}
                    value={userMetadata[f.fieldName]}
                    onChange={(val) =>
                      setUserMetadata((prev) => ({
                        ...prev,
                        [f.fieldName]: val,
                      }))
                    }
                  />
                ))
              )}
              <div className="flex justify-end pt-2 border-t border-border">
                <Button
                  onClick={handleSaveMetadata}
                  icon={Save}
                  disabled={pending}
                >
                  {pending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={openCreate}
        onOpenChange={setOpenCreate}
        title="New metadata field"
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="f-name">
              Field name
            </label>
            <input
              id="f-name"
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              className="w-full rounded border border-border px-3 py-2 text-sm"
              placeholder="employeeNumber"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="f-type">
              Type
            </label>
            <select
              id="f-type"
              value={fieldType}
              onChange={(e) =>
                setFieldType(e.target.value as UserMetadataFieldType)
              }
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background"
            >
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          {fieldType === 'select' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="f-options">
                Options (JSON array)
              </label>
              <input
                id="f-options"
                type="text"
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                className="w-full rounded border border-border px-3 py-2 text-sm font-mono"
                placeholder='["A","B","C"]'
              />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
            />
            Required
          </label>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setOpenCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateField}
              disabled={pending || fieldName.trim().length === 0}
            >
              {pending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {pending && (
        <Heading as="h2" className="sr-only">
          Working…
        </Heading>
      )}
    </div>
  );
}

function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: MetadataField;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" htmlFor={`v-${field.id}`}>
        {field.fieldName}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </label>
      {field.fieldType === 'select' && field.options ? (
        <select
          id={`v-${field.id}`}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-border px-3 py-2 text-sm bg-background"
        >
          <option value="">—</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : field.fieldType === 'boolean' ? (
        <input
          id={`v-${field.id}`}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      ) : field.fieldType === 'number' ? (
        <input
          id={`v-${field.id}`}
          type="number"
          value={typeof value === 'number' || typeof value === 'string' ? String(value) : ''}
          onChange={(e) =>
            onChange(e.target.value === '' ? null : Number(e.target.value))
          }
          className="w-full rounded border border-border px-3 py-2 text-sm"
        />
      ) : field.fieldType === 'date' ? (
        <input
          id={`v-${field.id}`}
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-border px-3 py-2 text-sm"
        />
      ) : (
        <input
          id={`v-${field.id}`}
          type="text"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-border px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
