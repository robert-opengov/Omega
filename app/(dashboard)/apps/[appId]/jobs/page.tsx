import { gabJobRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, PageHeader } from '@/components/ui/molecules';
import { AlertCircle } from 'lucide-react';
import { Text } from '@/components/ui/atoms';
import { JobsPanel } from './_components/JobsPanel';
import type { FailedJob, RecomputeProgress } from '@/lib/core/ports/job.repository';

export default async function AppJobsPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  await featureGuard('app.jobs');
  const { appId } = await params;

  let failed: { items: FailedJob[]; total: number } = { items: [], total: 0 };
  let progress: RecomputeProgress = {
    status: 'idle',
    progress: null,
    totalTables: null,
    completedTables: null,
    currentTableId: null,
    startedAt: null,
    completedAt: null,
    error: null,
  };
  let loadError: string | null = null;
  try {
    [failed, progress] = await Promise.all([
      gabJobRepo.listFailedJobs(appId).catch(() => ({ items: [], total: 0 })),
      gabJobRepo.getRecomputeStatus(appId).catch(() => progress),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load jobs';
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
            <div>
              <Text weight="medium" size="sm">Could not load jobs</Text>
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
        title="Jobs"
        description="Recompute background work and inspect failed jobs."
        condensed
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Recompute</CardTitle>
            <CardDescription>
              Re-run all computed fields across every table. This is safe but can take several minutes
              on large apps.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JobsPanel.Recompute appId={appId} initialProgress={progress} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Failed jobs</CardTitle>
            <CardDescription>
              Background jobs that exhausted their retry budget. Retry to put them back into the queue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JobsPanel.Failed appId={appId} initialFailed={failed.items} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
