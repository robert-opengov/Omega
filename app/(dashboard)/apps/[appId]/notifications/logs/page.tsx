import { gabNotificationRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { Card, CardContent, MetricCard, PageHeader } from '@/components/ui/molecules';
import { AlertCircle } from 'lucide-react';
import { Text } from '@/components/ui/atoms';
import { NotificationLogsTable } from './_components/NotificationLogsTable';
import type { NotificationLogQuery } from '@/lib/core/ports/notification.repository';

export default async function NotificationLogsPage({
  params,
  searchParams,
}: {
  params: Promise<{ appId: string }>;
  searchParams: Promise<{ status?: string; notificationId?: string; offset?: string; limit?: string }>;
}) {
  await featureGuard('app.notifications');
  const { appId } = await params;
  const sp = await searchParams;

  const query: NotificationLogQuery = {
    status: sp.status || undefined,
    notificationId: sp.notificationId || undefined,
    offset: sp.offset ? Number(sp.offset) : 0,
    limit: sp.limit ? Number(sp.limit) : 25,
  };

  let stats = { total: 0, sent: 0, failed: 0, queued: 0, bounced: 0, avgDeliveryMs: 0 };
  let logs = { items: [] as any[], total: 0, offset: 0, limit: 25 };
  let loadError: string | null = null;
  try {
    const [statsRes, logsRes] = await Promise.all([
      gabNotificationRepo.getLogStats(appId, query),
      gabNotificationRepo.listLogs(appId, query),
    ]);
    stats = statsRes;
    logs = logsRes;
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load notification logs';
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
            <div>
              <Text weight="medium" size="sm">Could not load notification logs</Text>
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
        title="Notification logs"
        description="Delivery history across all notifications in this app."
        condensed
        actions={
          <a
            href={`/apps/${appId}/notifications`}
            className="text-sm text-primary hover:underline"
          >
            ← Back to notifications
          </a>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard title="Total" value={String(stats.total)} />
        <MetricCard title="Sent" value={String(stats.sent)} />
        <MetricCard title="Failed" value={String(stats.failed)} />
        <MetricCard title="Queued" value={String(stats.queued)} />
        <MetricCard title="Bounced" value={String(stats.bounced)} />
        <MetricCard
          title="Avg delivery"
          value={stats.avgDeliveryMs ? `${stats.avgDeliveryMs} ms` : '—'}
        />
      </div>

      <NotificationLogsTable
        appId={appId}
        items={logs.items}
        total={logs.total}
        offset={logs.offset}
        limit={logs.limit}
      />
    </div>
  );
}
