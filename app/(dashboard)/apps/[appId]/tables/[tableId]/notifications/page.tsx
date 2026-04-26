import { AlertCircle } from 'lucide-react';
import { Text } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/molecules';
import { gabNotificationRepo, gabTableRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { NotificationsPanel } from '@/app/(dashboard)/apps/[appId]/notifications/_components/NotificationsPanel';
import type { GabNotification } from '@/lib/core/ports/notification.repository';

export default async function TableNotificationsPage({
  params,
}: {
  params: Promise<{ appId: string; tableId: string }>;
}) {
  // Per-table notifications require BOTH features. Guarding the stricter
  // one (notifications) is sufficient for the route, but we also gate on
  // tables so the link only appears for active table modules.
  await featureGuard('app.tables');
  await featureGuard('app.notifications');
  const { appId, tableId } = await params;

  const [tableResult, notificationsResult] = await Promise.allSettled([
    gabTableRepo.getTable(appId, tableId),
    gabNotificationRepo.listNotificationsByTable(appId, tableId),
  ]);

  if (tableResult.status === 'rejected') {
    const message =
      tableResult.reason instanceof Error
        ? tableResult.reason.message
        : 'Failed to load table.';
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
            <div>
              <Text weight="medium" size="sm">
                Could not load table notifications
              </Text>
              <Text size="xs" color="muted">
                {message}
              </Text>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const table = tableResult.value;
  const notifications: GabNotification[] =
    notificationsResult.status === 'fulfilled' ? notificationsResult.value.items : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Table notifications</CardTitle>
        <CardDescription>
          Manage notification rules for records in <span className="font-medium">{table.name}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <NotificationsPanel
          appId={appId}
          tables={[{ id: table.id, name: table.name }]}
          selectedTableId={table.id}
          initialNotifications={notifications}
        />
      </CardContent>
    </Card>
  );
}
