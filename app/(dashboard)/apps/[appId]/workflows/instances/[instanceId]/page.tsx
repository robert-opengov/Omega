import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Alert } from '@/components/ui/molecules';
import { gabWorkflowRepo } from '@/lib/core';
import { InstanceTraceViewer } from '@/components/_custom/WorkflowBuilder/_components/InstanceTraceViewer';

export default async function WorkflowInstanceDirectPage({
  params,
}: {
  params: Promise<{ appId: string; instanceId: string }>;
}) {
  const { appId, instanceId } = await params;

  const instanceRes = await gabWorkflowRepo
    .getInstance(appId, instanceId)
    .then((value) => ({ ok: true as const, value }))
    .catch((reason) => ({ ok: false as const, reason }));

  if (!instanceRes.ok) {
    const msg =
      instanceRes.reason instanceof Error
        ? instanceRes.reason.message
        : 'Failed to load workflow instance.';
    return (
      <div className="space-y-3">
        <Link
          href={`/apps/${appId}/workflows`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to workflows
        </Link>
        <Alert variant="error">{msg}</Alert>
      </div>
    );
  }

  const instance = instanceRes.value;
  const workflow = await gabWorkflowRepo
    .getWorkflow(appId, instance.workflowId)
    .catch(() => null);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Link
          href={`/apps/${appId}/workflows`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to workflows
        </Link>
        <h1 className="text-xl font-semibold text-foreground truncate">
          {workflow?.name ?? instance.workflowId} · Run details
        </h1>
      </div>
      <InstanceTraceViewer instance={instance} workflowName={workflow?.name} />
    </div>
  );
}
