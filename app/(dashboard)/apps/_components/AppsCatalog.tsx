'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import {
  AppWindow,
  Plus,
  Copy,
  Calendar,
  Building2,
  Lock,
  Database,
  AlertCircle,
} from 'lucide-react';
import { Badge, Button, Heading, Text } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  EmptyState,
  FormField,
  Modal,
  PageHeader,
  ZodForm,
} from '@/components/ui/molecules';
import { DataGrid } from '@/components/ui/organisms';
import type { Column } from '@/components/ui/molecules/DataTable';
import { createAppAction, copyAppAction } from '@/app/actions/apps';
import type { GabApp } from '@/lib/core/ports/app.repository';

const createAppSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Max 100 characters'),
  description: z.string().max(500, 'Max 500 characters').optional(),
});

type CreateAppFormValues = z.infer<typeof createAppSchema>;

const copyAppSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Max 100 characters'),
  includeData: z.boolean().optional(),
});

type CopyAppFormValues = z.infer<typeof copyAppSchema>;

export interface AppsCatalogProps {
  initialApps: GabApp[];
  loadError: string | null;
}

export function AppsCatalog({ initialApps, loadError }: AppsCatalogProps) {
  const router = useRouter();
  const [apps, setApps] = useState<GabApp[]>(initialApps);
  const [createOpen, setCreateOpen] = useState(false);
  const [copySource, setCopySource] = useState<GabApp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const columns = useMemo<Column<Record<string, unknown>>[]>(() => [
    {
      key: 'name',
      header: 'Name',
      render: (row) => {
        const app = row as unknown as GabApp;
        return (
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded bg-primary-light flex items-center justify-center shrink-0">
              <AppWindow className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <Link
                href={`/apps/${app.id}`}
                className="text-sm font-medium text-foreground hover:text-primary block truncate"
              >
                {app.name || '(unnamed)'}
              </Link>
              <Text size="xs" color="muted" className="truncate">
                {app.key}
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      key: 'tenantName',
      header: 'Tenant',
      render: (row) => {
        const app = row as unknown as GabApp;
        return app.tenantName ? (
          <span className="inline-flex items-center gap-1 text-sm">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            {app.tenantName}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: false,
      render: (row) => {
        const app = row as unknown as GabApp;
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {app.sandboxOf ? (
              <Badge variant="warning" size="sm">
                <Database className="h-3 w-3 mr-1" />
                Sandbox
              </Badge>
            ) : (
              <Badge variant="success" size="sm">Production</Badge>
            )}
            {app.schemaLockedAt && (
              <Badge variant="default" size="sm">
                <Lock className="h-3 w-3 mr-1" />
                Locked
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => {
        const app = row as unknown as GabApp;
        if (!app.createdAt) return <span className="text-muted-foreground">—</span>;
        const d = new Date(app.createdAt);
        return (
          <span className="inline-flex items-center gap-1 text-sm">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            {Number.isNaN(d.getTime()) ? app.createdAt : d.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      className: 'w-32 text-right',
      render: (row) => {
        const app = row as unknown as GabApp;
        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setCopySource(app);
              }}
              aria-label={`Copy ${app.name}`}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ], []);

  const handleCreate = (values: CreateAppFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await createAppAction({
        name: values.name,
        description: values.description,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setApps((prev) => [result.data, ...prev]);
      setCreateOpen(false);
      router.push(`/apps/${result.data.id}`);
    });
  };

  const handleCopy = (values: CopyAppFormValues) => {
    if (!copySource) return;
    setError(null);
    startTransition(async () => {
      const result = await copyAppAction(copySource.id, {
        name: values.name,
        includeData: values.includeData,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setApps((prev) => [result.data, ...prev]);
      setCopySource(null);
      router.push(`/apps/${result.data.id}`);
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Apps"
        description="Browse, create, and manage GAB Core applications across every tenant you can access."
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New App
          </Button>
        }
      />

      {loadError && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
              <div>
                <Text weight="medium" size="sm">Could not load apps</Text>
                <Text size="xs" color="muted">{loadError}</Text>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          {apps.length === 0 && !loadError ? (
            <EmptyState
              icon={AppWindow}
              title="No apps yet"
              description="Create your first GAB application to get started."
              action={{ label: 'New App', onClick: () => setCreateOpen(true) }}
            />
          ) : (
            <DataGrid
              data={apps as unknown as Record<string, unknown>[]}
              columns={columns}
              keyExtractor={(row) => (row as unknown as GabApp).id}
              searchable
              searchKeys={['name', 'key', 'tenantName']}
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
        title="New App"
        description="Create a brand-new GAB application. You can add tables and fields after it's created."
      >
        <ZodForm
          schema={createAppSchema}
          defaultValues={{ name: '', description: '' }}
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
              <FormField
                label="Description"
                error={errors.description?.message}
                {...register('description')}
              />
              {error && (
                <Text size="sm" className="text-danger-text">
                  {error}
                </Text>
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
                  {isPending ? 'Creating…' : 'Create App'}
                </Button>
              </div>
            </div>
          )}
        </ZodForm>
      </Modal>

      <Modal
        open={!!copySource}
        onOpenChange={(open) => {
          if (!open) {
            setCopySource(null);
            setError(null);
          }
        }}
        title={copySource ? `Copy "${copySource.name}"` : 'Copy App'}
        description="Schema is always copied. Toggle the option below to also copy production data."
      >
        {copySource && (
          <ZodForm
            schema={copyAppSchema}
            defaultValues={{ name: `${copySource.name} (copy)`, includeData: false }}
            onSubmit={handleCopy}
          >
            {({ register, formState: { errors } }) => (
              <div className="space-y-4">
                <FormField
                  label="New name"
                  required
                  error={errors.name?.message}
                  {...register('name')}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-primary h-4 w-4 rounded"
                    {...register('includeData')}
                  />
                  Include production data
                </label>
                {error && (
                  <Text size="sm" className="text-danger-text">
                    {error}
                  </Text>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCopySource(null)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={isPending}>
                    {isPending ? 'Copying…' : 'Copy App'}
                  </Button>
                </div>
              </div>
            )}
          </ZodForm>
        )}
      </Modal>

      <Heading as="h3" className="text-sm text-muted-foreground sr-only">
        Showing {apps.length} apps
      </Heading>
    </div>
  );
}
