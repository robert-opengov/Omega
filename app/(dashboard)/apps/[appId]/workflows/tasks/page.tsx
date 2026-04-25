import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Alert } from '@/components/ui/molecules';
import { gabWorkflowRepo } from '@/lib/core';
import { TaskInboxPanel } from '../_components/TaskInboxPanel';

export default async function WorkflowTasksPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;

  const [workflowsRes, tasksRes] = await Promise.allSettled([
    gabWorkflowRepo.listWorkflows(appId),
    gabWorkflowRepo.listTasks(appId, { status: 'pending' }),
  ]);

  if (tasksRes.status === 'rejected') {
    const msg =
      tasksRes.reason instanceof Error
        ? tasksRes.reason.message
        : 'Failed to load workflow tasks.';
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

  const workflows = workflowsRes.status === 'fulfilled' ? workflowsRes.value : [];

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
        <h1 className="text-xl font-semibold text-foreground">Workflow inbox</h1>
      </div>
      <TaskInboxPanel
        appId={appId}
        initialTasks={tasksRes.value}
        workflowNameById={Object.fromEntries(workflows.map((w) => [w.id, w.name]))}
      />
    </div>
  );
}
