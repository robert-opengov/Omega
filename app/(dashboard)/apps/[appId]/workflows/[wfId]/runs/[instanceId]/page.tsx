import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { gabWorkflowRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { Alert } from '@/components/ui/molecules';
import { InstanceTraceViewer } from '@/components/_custom/WorkflowBuilder/_components/InstanceTraceViewer';

export default async function WorkflowInstancePage({
  params,
}: {
  params: Promise<{ appId: string; wfId: string; instanceId: string }>;
}) {
  await featureGuard('app.workflows');
  const { appId, wfId, instanceId } = await params;

  const [workflowRes, instanceRes] = await Promise.allSettled([
    gabWorkflowRepo.getWorkflow(appId, wfId),
    gabWorkflowRepo.getInstance(appId, instanceId),
  ]);

  if (instanceRes.status === 'rejected') {
    const msg =
      instanceRes.reason instanceof Error
        ? instanceRes.reason.message
        : 'Failed to load workflow instance.';
    return (
      <div className="space-y-3">
        <Link
          href={`/apps/${appId}/workflows/${wfId}/runs`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to runs
        </Link>
        <Alert variant="error">{msg}</Alert>
      </div>
    );
  }

  const workflow = workflowRes.status === 'fulfilled' ? workflowRes.value : null;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Link
          href={`/apps/${appId}/workflows/${wfId}/runs`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to runs
        </Link>
        <h1 className="text-xl font-semibold text-foreground truncate">
          {workflow?.name ?? wfId} · Run details
        </h1>
      </div>
      <InstanceTraceViewer instance={instanceRes.value} workflowName={workflow?.name} />
    </div>
  );
}
