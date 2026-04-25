import Link from 'next/link';
import { gabAppRoleRepo, gabFieldRepo, gabTableRepo, gabWorkflowRepo } from '@/lib/core';
import { Alert } from '@/components/ui/molecules';
import { WorkflowBuilder } from '@/components/_custom/WorkflowBuilder';

export default async function WorkflowEditorPage({
  params,
}: {
  params: Promise<{ appId: string; wfId: string }>;
}) {
  const { appId, wfId } = await params;

  const [workflowRes, tablesRes, rolesRes] = await Promise.allSettled([
    gabWorkflowRepo.getWorkflow(appId, wfId),
    gabTableRepo.listTables(appId),
    gabAppRoleRepo.listRoles(appId),
  ]);

  if (workflowRes.status === 'rejected') {
    const msg = workflowRes.reason instanceof Error
      ? workflowRes.reason.message
      : 'Failed to load workflow.';
    return (
      <div className="space-y-3">
        <Link
          href={`/apps/${appId}/workflows`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to workflows
        </Link>
        <Alert variant="error">{msg}</Alert>
      </div>
    );
  }

  const workflow = workflowRes.value;
  const tables = tablesRes.status === 'fulfilled' ? tablesRes.value.items : [];
  const roles = rolesRes.status === 'fulfilled' ? rolesRes.value.items : [];

  const triggerTableId = workflow.config?.triggerTableId;
  let fields: Awaited<ReturnType<typeof gabFieldRepo.listFields>>['items'] = [];
  if (triggerTableId) {
    try {
      const res = await gabFieldRepo.listFields(appId, triggerTableId);
      fields = res.items;
    } catch {
      fields = [];
    }
  }

  return (
    <WorkflowBuilder
      appId={appId}
      workflow={workflow}
      tables={tables}
      fields={fields}
      roles={roles}
    />
  );
}
