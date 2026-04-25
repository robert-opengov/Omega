import { gabTableRepo, gabNotificationRepo } from '@/lib/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, PageHeader } from '@/components/ui/molecules';
import { AlertCircle } from 'lucide-react';
import { Text } from '@/components/ui/atoms';
import { NotificationsPanel } from './_components/NotificationsPanel';
import type { GabNotification } from '@/lib/core/ports/notification.repository';

export default async function AppNotificationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ appId: string }>;
  searchParams: Promise<{ tableId?: string }>;
}) {
  const { appId } = await params;
  const { tableId } = await searchParams;

  let tables: Awaited<ReturnType<typeof gabTableRepo.listTables>> = { items: [], total: 0 };
  let notifications: { items: GabNotification[] } = { items: [] };
  let loadError: string | null = null;

  try {
    tables = await gabTableRepo.listTables(appId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load tables';
  }

  const selectedTableId = tableId ?? tables.items[0]?.id ?? null;

  if (selectedTableId && !loadError) {
    try {
      notifications = await gabNotificationRepo.listNotificationsByTable(appId, selectedTableId);
    } catch {
      notifications = { items: [] };
    }
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
            <div>
              <Text weight="medium" size="sm">Could not load notifications</Text>
              <Text size="xs" color="muted">{loadError}</Text>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Per-table notifications fired on record events. Use the logs view to inspect deliveries."
        condensed
        actions={
          <a
            href={`/apps/${appId}/notifications/logs`}
            className="text-sm text-primary hover:underline"
          >
            View delivery logs →
          </a>
        }
      />
      {tables.items.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Text size="sm" color="muted">
              No tables yet. Create a table before configuring notifications.
            </Text>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Per-table notifications</CardTitle>
            <CardDescription>Pick a table, then add or edit its notifications.</CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationsPanel
              appId={appId}
              tables={tables.items.map((t) => ({ id: t.id, name: t.name }))}
              selectedTableId={selectedTableId}
              initialNotifications={notifications.items}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
