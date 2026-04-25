'use client';

import { useMemo, useState, useTransition } from 'react';
import { z } from 'zod';
import { Plus, Trash2, GitBranch, ArrowRight } from 'lucide-react';
import { Badge, Button, Text } from '@/components/ui/atoms';
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
  createRelationshipAction,
  deleteRelationshipAction,
} from '@/app/actions/relationships';
import type { GabRelationship } from '@/lib/core/ports/relationship.repository';
import type { GabTable } from '@/lib/core/ports/table.repository';

const RELATIONSHIP_TYPES = ['1:1', '1:N', 'N:M'] as const;

const createRelationshipSchema = z.object({
  parentTableId: z.string().min(1, 'Parent table is required'),
  childTableId: z.string().min(1, 'Child table is required'),
  type: z.enum(RELATIONSHIP_TYPES),
  childFkField: z.string().optional(),
});

type CreateRelationshipValues = z.infer<typeof createRelationshipSchema>;

export interface RelationshipsListProps {
  appId: string;
  initialRelationships: GabRelationship[];
  tables: GabTable[];
}

export function RelationshipsList({
  appId,
  initialRelationships,
  tables,
}: RelationshipsListProps) {
  const [relationships, setRelationships] = useState<GabRelationship[]>(initialRelationships);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<GabRelationship | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const tableMap = useMemo(() => {
    const map = new Map<string, GabTable>();
    for (const t of tables) map.set(t.id, t);
    return map;
  }, [tables]);

  const tableLabel = (id: string) => tableMap.get(id)?.name ?? id;

  const columns = useMemo<Column<Record<string, unknown>>[]>(() => [
    {
      key: 'parent',
      header: 'Parent',
      render: (row) => {
        const r = row as unknown as GabRelationship;
        return (
          <Text size="sm" weight="medium" className="truncate">
            {tableLabel(r.parentTableId)}
          </Text>
        );
      },
    },
    {
      key: 'arrow',
      header: '',
      sortable: false,
      className: 'w-8',
      render: () => <ArrowRight className="h-4 w-4 text-muted-foreground" />,
    },
    {
      key: 'child',
      header: 'Child',
      render: (row) => {
        const r = row as unknown as GabRelationship;
        return (
          <Text size="sm" weight="medium" className="truncate">
            {tableLabel(r.childTableId)}
          </Text>
        );
      },
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => {
        const r = row as unknown as GabRelationship;
        return <Badge variant="info" size="sm">{r.type}</Badge>;
      },
    },
    {
      key: 'fk',
      header: 'FK column',
      render: (row) => {
        const r = row as unknown as GabRelationship;
        return (
          <span className="font-mono text-xs text-muted-foreground">{r.childFkField}</span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      className: 'w-24 text-right',
      render: (row) => {
        const r = row as unknown as GabRelationship;
        return (
          <Button
            variant="ghost"
            size="sm"
            aria-label="Delete relationship"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(r);
            }}
          >
            <Trash2 className="h-3.5 w-3.5 text-danger-text" />
          </Button>
        );
      },
    },
  ], [tableMap]);

  const handleCreate = (values: CreateRelationshipValues) => {
    setError(null);
    if (values.parentTableId === values.childTableId) {
      setError('Parent and child must be different tables.');
      return;
    }
    startTransition(async () => {
      const res = await createRelationshipAction(appId, {
        parentTableId: values.parentTableId,
        childTableId: values.childTableId,
        type: values.type,
        ...(values.childFkField ? { childFkField: values.childFkField } : {}),
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setRelationships((prev) => [...prev, res.data]);
      setCreateOpen(false);
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    startTransition(async () => {
      const res = await deleteRelationshipAction(appId, target.id);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setRelationships((prev) => prev.filter((r) => r.id !== target.id));
      setConfirmDelete(null);
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relationships"
        description="Typed links between tables. GAB Core auto-creates the FK column on the child table."
        condensed
        actions={
          <Button
            variant="primary"
            onClick={() => setCreateOpen(true)}
            disabled={tables.length < 2}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Relationship
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          {relationships.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title="No relationships yet"
              description={
                tables.length < 2
                  ? 'Create at least two tables to define a relationship.'
                  : 'Link two tables together to enable lookups, summaries, and cascade deletes.'
              }
              {...(tables.length >= 2
                ? { action: { label: 'New Relationship', onClick: () => setCreateOpen(true) } }
                : {})}
            />
          ) : (
            <DataGrid
              data={relationships as unknown as Record<string, unknown>[]}
              columns={columns}
              keyExtractor={(row) => (row as unknown as GabRelationship).id}
              searchable
              pageSize={25}
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
        title="New Relationship"
        description="Pick a parent and child table. The FK column on the child can be auto-named."
      >
        <ZodForm
          schema={createRelationshipSchema}
          defaultValues={{
            parentTableId: tables[0]?.id ?? '',
            childTableId: tables[1]?.id ?? '',
            type: '1:N',
            childFkField: '',
          }}
          onSubmit={handleCreate}
        >
          {({ register, formState: { errors } }) => (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Parent table</label>
                <select
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  {...register('parentTableId')}
                >
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {errors.parentTableId && (
                  <Text size="xs" className="text-danger-text">
                    {errors.parentTableId.message}
                  </Text>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Child table</label>
                <select
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  {...register('childTableId')}
                >
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {errors.childTableId && (
                  <Text size="xs" className="text-danger-text">
                    {errors.childTableId.message}
                  </Text>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Type</label>
                <select
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  {...register('type')}
                >
                  {RELATIONSHIP_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <FormField
                label="FK column name (optional)"
                hint="Leave blank to auto-generate."
                error={errors.childFkField?.message}
                {...register('childFkField')}
              />
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
                  {isPending ? 'Creating…' : 'Create Relationship'}
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
        variant="danger"
        title="Delete relationship?"
        description={
          confirmDelete
            ? `The FK column "${confirmDelete.childFkField}" on the child table will also be removed.`
            : ''
        }
        confirmLabel={isPending ? 'Deleting…' : 'Delete relationship'}
        loading={isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
