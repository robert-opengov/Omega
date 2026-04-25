'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { Trash2, ChevronLeft } from 'lucide-react';
import { Button, Text } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  ConfirmDialog,
  FormField,
  PageHeader,
  ZodForm,
} from '@/components/ui/molecules';
import { useToast } from '@/providers/toast-provider';
import { deleteTenantAction, updateTenantAction } from '@/app/actions/tenants';
import type { GabTenant } from '@/lib/core/ports/tenant.repository';

const updateTenantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, 'Lowercase letters, numbers, and hyphens only')
    .optional()
    .or(z.literal('')),
});

type UpdateTenantForm = z.infer<typeof updateTenantSchema>;

interface CompanyDetailPanelProps {
  tenant: GabTenant;
}

export function CompanyDetailPanel({ tenant }: CompanyDetailPanelProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await deleteTenantAction(tenant.id);
    setDeleting(false);

    if (!res.success) {
      addToast(res.error ?? 'Failed to delete company.', 'error');
      return;
    }

    addToast('Company deleted.', 'success');
    setDeleteOpen(false);
    router.push('/companies');
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tenant.name}
        description={tenant.slug ? `Slug: ${tenant.slug}` : 'Company details'}
        breadcrumbs={[
          { label: 'Companies', href: '/companies' },
          { label: tenant.name },
        ]}
        condensed
        actions={
          <Button
            variant="outline"
            onClick={() => router.push('/companies')}
            icon={ChevronLeft}
          >
            Back
          </Button>
        }
      />

      <Card>
        <CardContent className="p-6 space-y-6">
          <ZodForm
            schema={updateTenantSchema}
            defaultValues={{
              name: tenant.name ?? '',
              slug: tenant.slug ?? '',
            }}
            onSubmit={async (values: UpdateTenantForm) => {
              setSaving(true);
              const res = await updateTenantAction(tenant.id, {
                name: values.name,
                slug: values.slug || undefined,
              });
              setSaving(false);

              if (!res.success) {
                addToast(res.error ?? 'Failed to update company.', 'error');
                return;
              }

              addToast('Company updated.', 'success');
              router.refresh();
            }}
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
                  label="Slug"
                  hint="Optional URL-safe identifier."
                  error={errors.slug?.message}
                  {...register('slug')}
                />
                <div className="flex flex-col gap-1 pt-2">
                  <Text size="xs" color="muted">
                    ID: <span className="font-mono">{tenant.id}</span>
                  </Text>
                  {tenant.createdAt && (
                    <Text size="xs" color="muted">
                      Created: {new Date(tenant.createdAt).toLocaleString()}
                    </Text>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="submit" disabled={saving} loading={saving}>
                    Save changes
                  </Button>
                </div>
              </div>
            )}
          </ZodForm>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div>
            <Text weight="semibold" size="sm" color="foreground">
              Danger zone
            </Text>
            <Text size="xs" color="muted">
              Deleting a company removes its identity from the platform. This action cannot be undone.
            </Text>
          </div>
          <Button
            variant="danger"
            icon={Trash2}
            onClick={() => setDeleteOpen(true)}
          >
            Delete company
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(o) => !deleting && setDeleteOpen(o)}
        title="Delete this company?"
        description={`"${tenant.name}" and its association with apps will be removed. This cannot be undone.`}
        confirmLabel="Delete company"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
