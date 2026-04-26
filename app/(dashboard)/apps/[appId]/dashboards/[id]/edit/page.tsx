import { notFound } from 'next/navigation';
import { gabCustomComponentRepo, gabDashboardRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { DashboardEditorClient } from '../../_components/DashboardEditorClient';

export default async function DashboardEditorPage({
  params,
}: {
  params: Promise<{ appId: string; id: string }>;
}) {
  await featureGuard('app.dashboards');
  const { appId, id } = await params;

  const [dashRes, customRes] = await Promise.allSettled([
    gabDashboardRepo.getDashboard(appId, id),
    gabCustomComponentRepo.listComponents(appId),
  ]);

  if (dashRes.status === 'rejected') notFound();
  const dashboard = dashRes.value;
  const customComponents =
    customRes.status === 'fulfilled' ? customRes.value.items : [];

  return (
    <DashboardEditorClient
      appId={appId}
      dashboard={dashboard}
      customComponents={customComponents}
    />
  );
}
