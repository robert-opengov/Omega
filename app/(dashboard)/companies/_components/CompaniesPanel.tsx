'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { Plus, Building2 } from 'lucide-react';
import { Button, Text } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  DataTable,
  EmptyState,
  FormField,
  Modal,
  PageHeader,
  ZodForm,
  type Column,
} from '@/components/ui/molecules';
import { useToast } from '@/providers/toast-provider';
import { createTenantAction } from '@/app/actions/tenants';
import type { GabTenant } from '@/lib/core/ports/tenant.repository';

const createTenantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, 'Lowercase letters, numbers, and hyphens only')
    .optional()
    .or(z.literal('')),
});

type CreateTenantForm = z.infer<typeof createTenantSchema>;

interface CompaniesPanelProps {
  tenants: GabTenant[];
  total: number;
}

export function CompaniesPanel({ tenants, total }: CompaniesPanelProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  type Row = GabTenant & Record<string, unknown>;

  const columns: Column<Row>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <span className="font-medium text-foreground">{row.name || '—'}</span>
      ),
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.slug || '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Tenants that own apps. Manage organizations across the platform."
        condensed
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create company
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4 space-y-3">
          <Text size="sm" color="muted">
            {total} compan{total === 1 ? 'y' : 'ies'}
          </Text>

          {tenants.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No companies yet"
              description="Create the first company to start onboarding tenants."
              action={{
                label: 'Create company',
                onClick: () => setCreateOpen(true),
              }}
            />
          ) : (
            <DataTable
              data={tenants as Row[]}
              columns={columns}
              keyExtractor={(r) => r.id}
              onRowClick={(r) => router.push(`/companies/${r.id}`)}
              tableLabel="Companies"
            />
          )}
        </CardContent>
      </Card>

      <Modal
        open={createOpen}
        onOpenChange={(o) => !submitting && setCreateOpen(o)}
        title="Create company"
        size="md"
      >
        <ZodForm
          schema={createTenantSchema}
          defaultValues={{ name: '', slug: '' }}
          onSubmit={async (values: CreateTenantForm) => {
            setSubmitting(true);
            const res = await createTenantAction({
              name: values.name,
              slug: values.slug || undefined,
            });
            setSubmitting(false);

            if (!res.success) {
              addToast(res.error ?? 'Failed to create company.', 'error');
              return;
            }

            addToast('Company created.', 'success');
            setCreateOpen(false);
            router.refresh();
          }}
        >
          {({ register, formState: { errors } }) => (
            <div className="space-y-4">
              <FormField
                label="Name"
                required
                placeholder="Acme Inc."
                error={errors.name?.message}
                {...register('name')}
              />
              <FormField
                label="Slug"
                hint="Optional URL-safe identifier (e.g. acme-inc)."
                placeholder="acme-inc"
                error={errors.slug?.message}
                {...register('slug')}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} loading={submitting}>
                  Create
                </Button>
              </div>
            </div>
          )}
        </ZodForm>
      </Modal>
    </div>
  );
}
