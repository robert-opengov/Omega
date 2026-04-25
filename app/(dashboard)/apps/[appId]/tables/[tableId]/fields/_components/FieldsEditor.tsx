'use client';

import { useMemo, useState, useTransition } from 'react';
import { z } from 'zod';
import { Plus, Trash2, AlertCircle, Lock, Sigma, Link2, Variable } from 'lucide-react';
import { Badge, Button, Heading, Text, Textarea } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  ConfirmDialog,
  EmptyState,
  FormField,
  Modal,
  PageHeader,
  ZodForm,
} from '@/components/ui/molecules';
import { DataGrid } from '@/components/ui/organisms';
import type { Column } from '@/components/ui/molecules/DataTable';
import {
  createFieldAction,
  deleteFieldAction,
  getFieldDependentsAction,
} from '@/app/actions/fields';
import type { GabField, FieldDependents } from '@/lib/core/ports/field.repository';

const FIELD_TYPES = [
  'string',
  'text',
  'number',
  'integer',
  'decimal',
  'boolean',
  'date',
  'datetime',
  'choice',
  'json',
  'formula',
  'lookup',
  'summary',
] as const;

const createFieldSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(FIELD_TYPES),
  required: z.boolean().optional(),
  formula: z.string().optional(),
});

type CreateFieldValues = z.infer<typeof createFieldSchema>;

export interface FieldsEditorProps {
  appId: string;
  tableId: string;
  initialFields: GabField[];
}

export function FieldsEditor({ appId, tableId, initialFields }: FieldsEditorProps) {
  const [fields, setFields] = useState<GabField[]>(initialFields);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    field: GabField;
    dependents: FieldDependents | null;
    loadingDeps: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const columns = useMemo<Column<Record<string, unknown>>[]>(() => [
    {
      key: 'name',
      header: 'Name',
      render: (row) => {
        const f = row as unknown as GabField;
        return (
          <div className="flex items-center gap-2 min-w-0">
            {fieldTypeIcon(f)}
            <div className="min-w-0">
              <Text size="sm" weight="medium" className="truncate">{f.name}</Text>
              <Text size="xs" color="muted" className="font-mono truncate">{f.key}</Text>
            </div>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => {
        const f = row as unknown as GabField;
        return <Badge variant={typeBadgeVariant(f.type)} size="sm">{f.type}</Badge>;
      },
    },
    {
      key: 'required',
      header: 'Required',
      render: (row) => {
        const f = row as unknown as GabField;
        return f.required ? (
          <Badge variant="info" size="sm">required</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    },
    {
      key: 'isSystem',
      header: 'System',
      render: (row) => {
        const f = row as unknown as GabField;
        return f.isSystem ? (
          <Badge variant="default" size="sm">
            <Lock className="h-3 w-3 mr-1" />
            system
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      className: 'w-24 text-right',
      render: (row) => {
        const f = row as unknown as GabField;
        if (f.isSystem) return null;
        return (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Delete ${f.name}`}
            onClick={(e) => {
              e.stopPropagation();
              openDeleteConfirm(f);
            }}
          >
            <Trash2 className="h-3.5 w-3.5 text-danger-text" />
          </Button>
        );
      },
    },
  ], []);

  const openDeleteConfirm = (field: GabField) => {
    setConfirmDelete({ field, dependents: null, loadingDeps: true });
    // Fire-and-forget dependents check; the dialog will refresh as soon as it returns.
    getFieldDependentsAction(appId, tableId, field.id).then((res) => {
      setConfirmDelete((prev) =>
        prev && prev.field.id === field.id
          ? {
              ...prev,
              loadingDeps: false,
              dependents: res.success ? res.data : null,
            }
          : prev,
      );
    });
  };

  const handleCreate = (values: CreateFieldValues) => {
    setError(null);
    startTransition(async () => {
      const res = await createFieldAction(appId, tableId, {
        name: values.name,
        type: values.type,
        required: values.required ?? false,
        ...(values.type === 'formula' && values.formula
          ? { formula: values.formula }
          : {}),
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setFields((prev) => [...prev, res.data].sort((a, b) => a.sortOrder - b.sortOrder));
      setCreateOpen(false);
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.dependents?.blocked) return;
    const target = confirmDelete.field;
    startTransition(async () => {
      const res = await deleteFieldAction(appId, tableId, target.id);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setFields((prev) => prev.filter((f) => f.id !== target.id));
      setConfirmDelete(null);
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fields"
        description="Schema columns. System fields are managed by the platform."
        condensed
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Field
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          {fields.length === 0 ? (
            <EmptyState
              title="No fields yet"
              description="Add the first field for this table."
              action={{ label: 'New Field', onClick: () => setCreateOpen(true) }}
            />
          ) : (
            <DataGrid
              data={fields as unknown as Record<string, unknown>[]}
              columns={columns}
              keyExtractor={(row) => (row as unknown as GabField).id}
              searchable
              searchKeys={['name', 'key', 'type']}
              pageSize={50}
              pageSizeOptions={[25, 50, 100]}
            />
          )}
        </CardContent>
      </Card>

      <Modal
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setError(null);
        }}
        title="New Field"
        description="Pick a type and give it a name. Computed types (formula, lookup, summary) can be configured after creation."
      >
        <ZodForm
          schema={createFieldSchema}
          defaultValues={{ name: '', type: 'string', required: false, formula: '' }}
          onSubmit={handleCreate}
        >
          {({ register, watch, formState: { errors } }) => {
            const selectedType = watch('type');
            return (
              <div className="space-y-4">
                <FormField
                  label="Name"
                  required
                  error={errors.name?.message}
                  {...register('name')}
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Type</label>
                  <select
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    {...register('type')}
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-primary h-4 w-4 rounded"
                    {...register('required')}
                  />
                  Required
                </label>
                {selectedType === 'formula' && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Formula expression</label>
                    <Textarea
                      rows={4}
                      placeholder="e.g. CONCAT(first_name, ' ', last_name)"
                      {...register('formula')}
                    />
                    <Text size="xs" color="muted">
                      Lookup and summary configuration are added in a follow-up edit screen.
                    </Text>
                  </div>
                )}
                {error && (
                  <Text size="sm" className="text-danger-text">{error}</Text>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={isPending}>
                    {isPending ? 'Creating…' : 'Create Field'}
                  </Button>
                </div>
              </div>
            );
          }}
        </ZodForm>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        variant="danger"
        title={confirmDelete ? `Delete "${confirmDelete.field.name}"?` : 'Delete field?'}
        description={renderDependentsDescription(confirmDelete)}
        confirmLabel={
          confirmDelete?.dependents?.blocked
            ? 'Blocked by dependents'
            : isPending
              ? 'Deleting…'
              : 'Delete field'
        }
        loading={isPending}
        onConfirm={handleDelete}
      />

      <Heading as="h3" className="sr-only">
        {fields.length} fields
      </Heading>
    </div>
  );
}

function fieldTypeIcon(field: GabField) {
  if (field.formula) return <Sigma className="h-4 w-4 text-info-text shrink-0" />;
  if (field.lookupConfig) return <Link2 className="h-4 w-4 text-info-text shrink-0" />;
  if (field.summaryConfig) return <Sigma className="h-4 w-4 text-warning-text shrink-0" />;
  return <Variable className="h-4 w-4 text-primary shrink-0" />;
}

function typeBadgeVariant(type: string) {
  if (type === 'formula' || type === 'lookup' || type === 'summary') return 'info' as const;
  return 'default' as const;
}

function renderDependentsDescription(state: {
  field: GabField;
  dependents: FieldDependents | null;
  loadingDeps: boolean;
} | null) {
  if (!state) return null;
  if (state.loadingDeps) {
    return 'Checking for dependent formulas, lookups, and summaries…';
  }
  if (!state.dependents) {
    return (
      <span>
        Could not check dependents. The field will still be deleted along with all its
        column data — this cannot be undone.
      </span>
    );
  }
  if (state.dependents.blocked) {
    return (
      <span className="space-y-2">
        <span className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-danger-text mt-0.5 shrink-0" />
          <span>{state.dependents.blockReason ?? 'Field is referenced by other computed fields.'}</span>
        </span>
        {state.dependents.dependents.length > 0 && (
          <ul className="text-xs space-y-0.5 mt-1 ml-6 list-disc">
            {state.dependents.dependents.slice(0, 5).map((d) => (
              <li key={d.fieldId}>
                {d.tableName} → {d.fieldName} ({d.type})
              </li>
            ))}
            {state.dependents.dependents.length > 5 && (
              <li>+{state.dependents.dependents.length - 5} more</li>
            )}
          </ul>
        )}
      </span>
    );
  }
  return (
    <span>
      No dependent formulas or summaries reference this field. Its column and all data
      will be permanently dropped — this cannot be undone.
    </span>
  );
}
