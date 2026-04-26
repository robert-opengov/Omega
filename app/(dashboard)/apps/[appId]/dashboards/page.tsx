import { gabDashboardRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { DashboardsListPanel } from './_components/DashboardsListPanel';

export default async function DashboardsListPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  await featureGuard('app.dashboards');
  const { appId } = await params;

  const res = await Promise.allSettled([gabDashboardRepo.listDashboards(appId)]);
  const items = res[0].status === 'fulfilled' ? res[0].value.items : [];
  const initialError =
    res[0].status === 'rejected'
      ? res[0].reason instanceof Error
        ? res[0].reason.message
        : 'Failed to load dashboards.'
      : null;

  return (
    <DashboardsListPanel
      appId={appId}
      initialDashboards={items}
      initialError={initialError}
    />
  );
}
