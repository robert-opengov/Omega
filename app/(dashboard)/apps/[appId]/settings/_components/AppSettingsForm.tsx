'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Package, Save, Trash2 } from 'lucide-react';
import { Button, Text, Textarea } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  FormField,
  Modal,
  ZodForm,
} from '@/components/ui/molecules';
import { deleteAppAction, updateAppAction } from '@/app/actions/apps';
import { extractTemplateFromAppAction } from '@/app/actions/templates';
import type { GabApp } from '@/lib/core/ports/app.repository';

const settingsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  timezone: z.string().min(1, 'Timezone is required'),
});

type SettingsValues = z.infer<typeof settingsSchema>;

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Phoenix',
  'America/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export interface AppSettingsFormProps {
  app: GabApp;
}

export function AppSettingsForm({ app }: AppSettingsFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSaving, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [extractOpen, setExtractOpen] = useState(false);
  const [extractName, setExtractName] = useState(`${app.name} template`);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [isExtracting, startExtract] = useTransition();

  const onExtract = () => {
    setExtractError(null);
    startExtract(async () => {
      const res = await extractTemplateFromAppAction(app.id, {
        ...(extractName ? { templateName: extractName } : {}),
      });
      if (!res.success) {
        setExtractError(res.error);
        return;
      }
      setExtractOpen(false);
      router.push(`/templates/${res.data.id}`);
      router.refresh();
    });
  };

  const onSave = (values: SettingsValues) => {
    setError(null);
    setSuccess(false);
    startSave(async () => {
      const res = await updateAppAction(app.id, {
        name: values.name,
        description: values.description ?? null,
        timezone: values.timezone,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  };

  const onDelete = () => {
    setError(null);
    startDelete(async () => {
      const res = await deleteAppAction(app.id);
      if (!res.success) {
        setError(res.error);
        setConfirmDelete(false);
        return;
      }
      router.replace('/apps');
      router.refresh();
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Display name, description, and per-app timezone.</CardDescription>
        </CardHeader>
        <CardContent>
          <ZodForm
            schema={settingsSchema}
            defaultValues={{
              name: app.name,
              description: app.description ?? '',
              timezone: app.timezone ?? 'UTC',
            }}
            onSubmit={onSave}
          >
            {({ register, formState: { errors } }) => (
              <div className="space-y-4">
                <FormField
                  label="Name"
                  required
                  error={errors.name?.message}
                  {...register('name')}
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea rows={3} {...register('description')} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Timezone</label>
                  <select
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    {...register('timezone')}
                  >
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                  {errors.timezone && (
                    <Text size="xs" className="text-danger-text">
                      {errors.timezone.message}
                    </Text>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Text size="xs" color="muted">App key</Text>
                  <Text size="sm" className="font-mono">{app.key}</Text>
                </div>
                {error && (
                  <Text size="sm" className="text-danger-text">{error}</Text>
                )}
                {success && (
                  <Text size="sm" className="text-success-text">Saved.</Text>
                )}
                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" disabled={isSaving}>
                    <Save className="h-4 w-4 mr-1.5" />
                    {isSaving ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              </div>
            )}
          </ZodForm>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>
            Extract this app&apos;s schema into a reusable template that other tenants
            can stamp into their own apps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setExtractOpen(true)}>
            <Package className="h-4 w-4 mr-1.5" />
            Extract template from app
          </Button>
        </CardContent>
      </Card>

      <Card className="border-danger-light-border">
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>
            Deleting an app drops its database and all of its tables, fields,
            relationships, and records. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete app
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        variant="danger"
        title={`Delete "${app.name}"?`}
        description="The entire app database and all data will be permanently dropped. This cannot be undone."
        confirmLabel={isDeleting ? 'Deleting…' : 'Delete app'}
        loading={isDeleting}
        onConfirm={onDelete}
      />

      <Modal
        open={extractOpen}
        onOpenChange={(open) => {
          setExtractOpen(open);
          if (!open) setExtractError(null);
        }}
        title="Extract template"
        description="Captures the current schema as a new template draft. Publish it from the templates page to make it available to other tenants."
        primaryAction={{
          label: isExtracting ? 'Extracting…' : 'Extract',
          onClick: onExtract,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setExtractOpen(false),
        }}
      >
        <div className="space-y-3">
          <FormField
            label="Template name"
            value={extractName}
            onChange={(e) => setExtractName(e.target.value)}
          />
          {extractError && (
            <Text size="sm" className="text-danger-text">{extractError}</Text>
          )}
        </div>
      </Modal>
    </div>
  );
}
