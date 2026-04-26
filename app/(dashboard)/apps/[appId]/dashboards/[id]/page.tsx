import Link from 'next/link';
import { Pencil, ArrowLeft } from 'lucide-react';
import { gabDashboardRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { Text } from '@/components/ui/atoms';
import { PageHeader } from '@/components/ui/molecules';
import { PageRenderer } from '@/components/_custom/page-builder/PageRenderer';

export default async function DashboardViewerPage({
  params,
}: {
  params: Promise<{ appId: string; id: string }>;
}) {
  await featureGuard('app.dashboards');
  const { appId, id } = await params;

  let dashboard;
  let loadError: string | null = null;
  try {
    dashboard = await gabDashboardRepo.getDashboard(appId, id);
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load dashboard.';
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={dashboard?.name ?? 'Dashboard'}
        description={dashboard?.description}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/apps/${appId}/dashboards`}
              className="inline-flex items-center gap-2 h-8 px-3 text-sm rounded border border-border bg-background text-foreground hover:bg-action-hover-primary"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Back
            </Link>
            <Link
              href={`/apps/${appId}/dashboards/${id}/edit`}
              className="inline-flex items-center gap-2 h-8 px-3 text-sm rounded bg-primary text-primary-foreground hover:bg-primary-dark"
            >
              <Pencil className="h-4 w-4 shrink-0" />
              Edit layout
            </Link>
          </div>
        }
      />
      {loadError && (
        <Text size="sm" color="destructive">
          {loadError}
        </Text>
      )}
      {dashboard && <PageRenderer layout={dashboard.layout} appId={appId} />}
    </div>
  );
}
