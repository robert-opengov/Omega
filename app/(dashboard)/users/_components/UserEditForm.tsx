'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { ChevronLeft } from 'lucide-react';
import { Button, Switch, Text } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  FormField,
  LabelValuePair,
  PageHeader,
  ZodForm,
} from '@/components/ui/molecules';
import { useToast } from '@/providers/toast-provider';
import { updateUserAction } from '@/app/actions/users';
import type { GabUser } from '@/lib/core/ports/user.repository';

const updateUserSchema = z.object({
  firstName: z.string().optional().or(z.literal('')),
  lastName: z.string().optional().or(z.literal('')),
  active: z.boolean(),
  twoFactorEnabled: z.boolean(),
});

type UpdateUserForm = z.infer<typeof updateUserSchema>;

interface UserEditFormProps {
  user: GabUser;
  tenantName?: string | null;
}

export function UserEditForm({ user, tenantName }: UserEditFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const titleName = fullName || user.email;

  return (
    <div className="space-y-6">
      <PageHeader
        title={titleName}
        description={user.email}
        breadcrumbs={[
          { label: 'Users', href: '/users' },
          { label: titleName },
        ]}
        condensed
        actions={
          <Button
            variant="outline"
            onClick={() => router.push('/users')}
            icon={ChevronLeft}
          >
            Back
          </Button>
        }
      />

      <Card>
        <CardContent className="p-6 space-y-6">
          <ZodForm
            schema={updateUserSchema}
            defaultValues={{
              firstName: user.firstName ?? '',
              lastName: user.lastName ?? '',
              active: user.active,
              twoFactorEnabled: user.twoFactorEnabled,
            }}
            onSubmit={async (values: UpdateUserForm) => {
              setSaving(true);
              const res = await updateUserAction(user.id, {
                firstName: values.firstName || '',
                lastName: values.lastName || '',
                active: values.active,
                twoFactorEnabled: values.twoFactorEnabled,
              });
              setSaving(false);

              if (!res.success) {
                addToast(res.error ?? 'Failed to update user.', 'error');
                return;
              }

              addToast('User updated.', 'success');
              router.refresh();
            }}
          >
            {({
              register,
              setValue,
              watch,
              formState: { errors },
            }) => {
              const active = watch('active');
              const twoFactorEnabled = watch('twoFactorEnabled');

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="First name"
                      error={errors.firstName?.message}
                      {...register('firstName')}
                    />
                    <FormField
                      label="Last name"
                      error={errors.lastName?.message}
                      {...register('lastName')}
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <Switch
                      checked={active}
                      onCheckedChange={(v) => setValue('active', v, { shouldDirty: true })}
                      label="Active"
                    />
                    <Switch
                      checked={twoFactorEnabled}
                      onCheckedChange={(v) =>
                        setValue('twoFactorEnabled', v, { shouldDirty: true })
                      }
                      label="Two-factor authentication enabled"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="submit" disabled={saving} loading={saving}>
                      Save changes
                    </Button>
                  </div>
                </div>
              );
            }}
          </ZodForm>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <Text weight="semibold" size="sm" color="foreground">
            Account info
          </Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <LabelValuePair label="Email" value={user.email || '—'} />
            <LabelValuePair
              label="Source"
              value={user.isExternalUser ? 'External (SSO)' : 'Internal'}
            />
            <LabelValuePair
              label="Company"
              value={
                user.tenantId ? (
                  <Link
                    href={`/companies/${user.tenantId}`}
                    className="text-primary hover:underline"
                  >
                    {tenantName ?? user.tenantId}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )
              }
            />
            <LabelValuePair
              label="User ID"
              value={<span className="font-mono text-xs">{user.id}</span>}
            />
            <LabelValuePair
              label="Created"
              value={
                user.createdAt
                  ? new Date(user.createdAt).toLocaleString()
                  : '—'
              }
            />
            <LabelValuePair
              label="Updated"
              value={
                user.updatedAt
                  ? new Date(user.updatedAt).toLocaleString()
                  : '—'
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
