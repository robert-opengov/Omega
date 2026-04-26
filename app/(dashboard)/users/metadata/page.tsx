import {
  gabAppRepo,
  gabUserMetadataRepo,
  gabUserRepo,
} from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { Card, CardContent, EmptyState } from '@/components/ui/molecules';
import { Database } from 'lucide-react';
import { Text } from '@/components/ui/atoms';
import { UserMetadataAdmin } from './_components/UserMetadataAdmin';
import type { GabApp } from '@/lib/core/ports/app.repository';
import type { GabUser } from '@/lib/core/ports/user.repository';

export default async function UserMetadataAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ appId?: string }>;
}) {
  await featureGuard('platform.userMetadata');
  const sp = await searchParams;

  let apps: GabApp[] = [];
  let appsError: string | null = null;
  try {
    const res = await gabAppRepo.listApps();
    apps = res.items;
  } catch (err) {
    appsError = err instanceof Error ? err.message : 'Failed to load apps';
  }

  if (!apps.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={Database}
            title="No apps available"
            description={
              appsError
                ? `Could not load apps: ${appsError}`
                : 'User metadata is per-app. Create an app first to define metadata fields.'
            }
            size="medium"
          />
        </CardContent>
      </Card>
    );
  }

  const selectedAppId = sp.appId && apps.some((a) => a.id === sp.appId)
    ? sp.appId
    : apps[0].id;

  let fields: Awaited<ReturnType<typeof gabUserMetadataRepo.listFields>>['items'] = [];
  let users: GabUser[] = [];
  let loadError: string | null = null;
  try {
    const [fieldsRes, usersRes] = await Promise.all([
      gabUserMetadataRepo.listFields(selectedAppId),
      gabUserRepo.listUsers({ pageSize: 200 }),
    ]);
    fields = fieldsRes.items;
    users = usersRes.items;
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load metadata';
  }

  return (
    <div className="space-y-4">
      {loadError && (
        <Text size="sm" color="destructive">
          {loadError}
        </Text>
      )}
      <UserMetadataAdmin
        apps={apps.map((a) => ({ id: a.id, name: a.name }))}
        selectedAppId={selectedAppId}
        fields={fields}
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
        }))}
      />
    </div>
  );
}
