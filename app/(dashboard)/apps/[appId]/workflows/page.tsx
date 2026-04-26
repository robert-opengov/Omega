import { gabWorkflowRepo, gabTableRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { WorkflowsPanel } from './_components/WorkflowsPanel';

export default async function AppWorkflowsPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  await featureGuard('app.workflows');
  const { appId } = await params;

  const [workflowsRes, instancesRes, tasksRes, tablesRes] = await Promise.allSettled([
    gabWorkflowRepo.listWorkflows(appId),
    gabWorkflowRepo.listInstances(appId),
    gabWorkflowRepo.listTasks(appId, { status: 'pending' }),
    gabTableRepo.listTables(appId),
  ]);

  const workflows = workflowsRes.status === 'fulfilled' ? workflowsRes.value : [];
  const instances = instancesRes.status === 'fulfilled' ? instancesRes.value : [];
  const tasks = tasksRes.status === 'fulfilled' ? tasksRes.value : [];
  const tables = tablesRes.status === 'fulfilled' ? tablesRes.value.items : [];

  const initialError =
    workflowsRes.status === 'rejected'
      ? workflowsRes.reason instanceof Error
        ? workflowsRes.reason.message
        : 'Failed to load workflows.'
      : null;

  return (
    <WorkflowsPanel
      appId={appId}
      initialWorkflows={workflows}
      initialInstances={instances}
      initialTasks={tasks}
      tables={tables}
      initialError={initialError}
    />
  );
}
