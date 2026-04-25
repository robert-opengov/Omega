'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Save, Trash2 } from 'lucide-react';
import { Button, Text, Textarea } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  FormField,
  ZodForm,
} from '@/components/ui/molecules';
import { deleteAppAction, updateAppAction } from '@/app/actions/apps';
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
    </div>
  );
}
