'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { z } from 'zod';
import {
  Package,
  ArrowRight,
  AlertCircle,
  Trash2,
  PlusSquare,
} from 'lucide-react';
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
import {
  deleteTemplateAction,
  materializeTemplateAction,
} from '@/app/actions/templates';
import type { GabTemplate } from '@/lib/core/ports/template.repository';
import type { GabTenant } from '@/lib/core/ports/tenant.repository';

const materializeSchema = z.object({
  appName: z.string().min(1, 'Required'),
  tenantId: z.string().min(1, 'Pick a tenant'),
});

type MaterializeValues = z.infer<typeof materializeSchema>;

export interface TemplatesCatalogProps {
  initialTemplates: GabTemplate[];
  tenants: GabTenant[];
}

export function TemplatesCatalog({
  initialTemplates,
  tenants,
}: TemplatesCatalogProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<GabTemplate[]>(initialTemplates);
  const [materializeFor, setMaterializeFor] = useState<GabTemplate | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<GabTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onMaterialize = (values: MaterializeValues) => {
    if (!materializeFor) return;
    setError(null);
    const target = materializeFor;
    startTransition(async () => {
      const res = await materializeTemplateAction(target.id, values);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setMaterializeFor(null);
      router.push(`/apps/${res.data.id}`);
      router.refresh();
    });
  };

  const onDelete = () => {
    if (!confirmDelete) return;
    setError(null);
    const target = confirmDelete;
    startTransition(async () => {
      const res = await deleteTemplateAction(target.id);
      if (!res.success) {
        setError(res.error);
        setConfirmDelete(null);
        return;
      }
      setTemplates((prev) => prev.filter((t) => t.id !== target.id));
      setConfirmDelete(null);
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Templates"
        description="Reusable schemas. Stamp them into new apps, then push updates to subscribers."
        condensed
      />

      {error && (
        <div className="flex items-start gap-2 p-2 rounded bg-danger-light text-danger-text">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <Text size="sm">{error}</Text>
        </div>
      )}

      {templates.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Package}
              title="No templates yet"
              description="Templates are created from existing apps via Settings → Extract template."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded bg-primary-light flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Text size="sm" weight="semibold" className="truncate">
                      {template.name}
                    </Text>
                    <Text size="xs" color="muted" className="line-clamp-2">
                      {template.description ?? 'No description provided.'}
                    </Text>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge size="sm" variant={template.status === 'published' ? 'success' : 'default'}>
                    {template.status}
                  </Badge>
                  <Badge size="sm" variant="info">
                    v{template.currentVersion}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setMaterializeFor(template)}
                    disabled={tenants.length === 0}
                  >
                    <PlusSquare className="h-3.5 w-3.5 mr-1.5" />
                    Use template
                  </Button>
                  <Link href={`/templates/${template.id}`}>
                    <Button variant="outline" size="sm">
                      Manage
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmDelete(template)}
                    aria-label="Delete template"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!materializeFor}
        onOpenChange={(open) => {
          if (!open) {
            setMaterializeFor(null);
            setError(null);
          }
        }}
        title={materializeFor ? `Stamp app from "${materializeFor.name}"` : ''}
        description="Creates a new application initialised from the latest version of this template."
      >
        {materializeFor && (
          <ZodForm
            schema={materializeSchema}
            defaultValues={{
              appName: materializeFor.name,
              tenantId: tenants[0]?.id ?? '',
            }}
            onSubmit={onMaterialize}
          >
            {({ register, formState: { errors } }) => (
              <div className="space-y-4">
                <FormField
                  label="App name"
                  required
                  error={errors.appName?.message}
                  {...register('appName')}
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Tenant
                    <span className="text-danger-text ml-0.5">*</span>
                  </label>
                  <select
                    {...register('tenantId')}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {errors.tenantId?.message && (
                    <Text size="xs" className="text-danger-text">
                      {errors.tenantId.message}
                    </Text>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMaterializeFor(null)}
                    disabled={pending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={pending}>
                    {pending ? 'Creating…' : 'Create app'}
                  </Button>
                </div>
              </div>
            )}
          </ZodForm>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        variant="danger"
        title="Delete template?"
        description={
          confirmDelete
            ? `"${confirmDelete.name}" and all its versions will be removed. Apps stamped from this template are not affected.`
            : ''
        }
        confirmLabel={pending ? 'Deleting…' : 'Delete template'}
        loading={pending}
        onConfirm={onDelete}
      />
    </div>
  );
}
