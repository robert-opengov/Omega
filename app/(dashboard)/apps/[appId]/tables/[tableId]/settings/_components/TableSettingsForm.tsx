'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Trash2, Save } from 'lucide-react';
import { Button, Heading, Text } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  ConfirmDialog,
  FormField,
  ZodForm,
} from '@/components/ui/molecules';
import { deleteTableAction, updateTableAction } from '@/app/actions/tables';
import type { GabTable } from '@/lib/core/ports/table.repository';

const settingsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  icon: z.string().optional(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export interface TableSettingsFormProps {
  appId: string;
  table: GabTable;
}

export function TableSettingsForm({ appId, table }: TableSettingsFormProps) {
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
      const res = await updateTableAction(appId, table.id, {
        name: values.name,
        ...(values.icon ? { icon: values.icon } : {}),
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
      const res = await deleteTableAction(appId, table.id);
      if (!res.success) {
        setError(res.error);
        setConfirmDelete(false);
        return;
      }
      router.replace(`/apps/${appId}/tables`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Display name and icon used throughout the app.</CardDescription>
        </CardHeader>
        <CardContent>
          <ZodForm
            schema={settingsSchema}
            defaultValues={{ name: table.name, icon: '' }}
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
                <FormField
                  label="Icon (Lucide name)"
                  hint="Optional. Examples: Database, Users, FileText."
                  error={errors.icon?.message}
                  {...register('icon')}
                />
                <div className="space-y-1.5">
                  <Text size="xs" color="muted">Key</Text>
                  <Text size="sm" className="font-mono">{table.key}</Text>
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
            Deleting a table drops all of its records, fields, and any formulas that
            reference them. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete table
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        variant="danger"
        title={`Delete "${table.name}"?`}
        description="All records and fields in this table will be permanently dropped. This cannot be undone."
        confirmLabel={isDeleting ? 'Deleting…' : 'Delete table'}
        loading={isDeleting}
        onConfirm={onDelete}
      />

      <Heading as="h3" className="sr-only">Settings for {table.name}</Heading>
    </div>
  );
}
