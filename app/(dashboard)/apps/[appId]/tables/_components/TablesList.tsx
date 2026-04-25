'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Database, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button, Heading, Text } from '@/components/ui/atoms';
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
import { createTableAction, deleteTableAction } from '@/app/actions/tables';
import type { GabTable } from '@/lib/core/ports/table.repository';

const createTableSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  createReportAndForm: z.boolean().optional(),
});

type CreateTableValues = z.infer<typeof createTableSchema>;

export interface TablesListProps {
  appId: string;
  initialTables: GabTable[];
  loadError: string | null;
}

export function TablesList({ appId, initialTables, loadError }: TablesListProps) {
  const router = useRouter();
  const [tables, setTables] = useState<GabTable[]>(initialTables);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<GabTable | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const columns = useMemo<Column<Record<string, unknown>>[]>(() => [
    {
      key: 'name',
      header: 'Name',
      render: (row) => {
        const t = row as unknown as GabTable;
        return (
          <div className="flex items-center gap-2 min-w-0">
            <Database className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <Link
                href={`/apps/${appId}/tables/${t.id}`}
                className="text-sm font-medium text-foreground hover:text-primary block truncate"
              >
                {t.name}
              </Link>
              <Text size="xs" color="muted" className="font-mono truncate">{t.key}</Text>
            </div>
          </div>
        );
      },
    },
    {
      key: 'keyFieldId',
      header: 'Key field',
      render: (row) => {
        const t = row as unknown as GabTable;
        return t.keyFieldId ? (
          <span className="font-mono text-xs">{t.keyFieldId}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => {
        const t = row as unknown as GabTable;
        if (!t.createdAt) return <span className="text-muted-foreground">—</span>;
        const d = new Date(t.createdAt);
        return Number.isNaN(d.getTime())
          ? t.createdAt
          : <span className="text-sm">{d.toLocaleDateString()}</span>;
      },
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      className: 'w-24 text-right',
      render: (row) => {
        const t = row as unknown as GabTable;
        return (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Delete ${t.name}`}
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(t);
            }}
          >
            <Trash2 className="h-3.5 w-3.5 text-danger-text" />
          </Button>
        );
      },
    },
  ], [appId]);

  const handleCreate = (values: CreateTableValues) => {
    setError(null);
    startTransition(async () => {
      const res = await createTableAction(appId, {
        name: values.name,
        createReportAndForm: values.createReportAndForm ?? true,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setTables((prev) => [res.data, ...prev]);
      setCreateOpen(false);
      router.push(`/apps/${appId}/tables/${res.data.id}`);
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    startTransition(async () => {
      const res = await deleteTableAction(appId, target.id);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setTables((prev) => prev.filter((t) => t.id !== target.id));
      setConfirmDelete(null);
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tables"
        description="Each table is a typed schema definition with its own records and computed-field DAG."
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Table
          </Button>
        }
      />

      {loadError && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
              <div>
                <Text weight="medium" size="sm">Could not load tables</Text>
                <Text size="xs" color="muted">{loadError}</Text>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          {tables.length === 0 && !loadError ? (
            <EmptyState
              icon={Database}
              title="No tables yet"
              description="Tables hold the schema and data for this app."
              action={{ label: 'New Table', onClick: () => setCreateOpen(true) }}
            />
          ) : (
            <DataGrid
              data={tables as unknown as Record<string, unknown>[]}
              columns={columns}
              keyExtractor={(row) => (row as unknown as GabTable).id}
              searchable
              searchKeys={['name', 'key']}
              pageSize={25}
              pageSizeOptions={[10, 25, 50, 100]}
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
        title="New Table"
        description="Tables are added immediately. You can edit fields after creation."
      >
        <ZodForm
          schema={createTableSchema}
          defaultValues={{ name: '', createReportAndForm: true }}
          onSubmit={handleCreate}
        >
          {({ register, formState: { errors } }) => (
            <div className="space-y-4">
              <FormField
                label="Name"
                required
                error={errors.name?.message}
                {...register('name')}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-primary h-4 w-4 rounded"
                  {...register('createReportAndForm')}
                />
                Create a default form and report
              </label>
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
                  {isPending ? 'Creating…' : 'Create Table'}
                </Button>
              </div>
            </div>
          )}
        </ZodForm>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        title={confirmDelete ? `Delete "${confirmDelete.name}"?` : 'Delete table?'}
        description="All records in this table will be permanently deleted. This cannot be undone."
        confirmLabel={isPending ? 'Deleting…' : 'Delete'}
        onConfirm={handleDelete}
        variant="danger"
      />

      <Heading as="h3" className="sr-only">
        Showing {tables.length} tables
      </Heading>
    </div>
  );
}
