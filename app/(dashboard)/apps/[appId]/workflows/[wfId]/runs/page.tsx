import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { gabWorkflowRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { Alert } from '@/components/ui/molecules';
import { InstancesTable } from '../../_components/InstancesTable';

export default async function WorkflowRunsPage({
  params,
}: {
  params: Promise<{ appId: string; wfId: string }>;
}) {
  await featureGuard('app.workflows');
  const { appId, wfId } = await params;

  const [workflowRes, instancesRes] = await Promise.allSettled([
    gabWorkflowRepo.getWorkflow(appId, wfId),
    gabWorkflowRepo.listInstances(appId, { workflowId: wfId }),
  ]);

  const workflow = workflowRes.status === 'fulfilled' ? workflowRes.value : null;
  const instances = instancesRes.status === 'fulfilled' ? instancesRes.value : [];
  const error =
    instancesRes.status === 'rejected'
      ? instancesRes.reason instanceof Error
        ? instancesRes.reason.message
        : 'Failed to load workflow runs.'
      : null;

  const workflowName = workflow?.name ?? wfId;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <Link
            href={`/apps/${appId}/workflows/${wfId}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to editor
          </Link>
          <h1 className="text-xl font-semibold text-foreground truncate">
            {workflowName} · Runs
          </h1>
        </div>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <InstancesTable
        appId={appId}
        instances={instances}
        workflowNameById={{ [wfId]: workflowName }}
      />
    </div>
  );
}
