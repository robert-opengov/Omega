/**
 * Workflow port — mirrors GAB Core's SPA workflow contract verbatim.
 *
 * Source of truth: apps/web/src/api/queries/workflows.ts in GAB Core.
 * The GAB V2 backend's Effect HTTP service currently only stubs `listWorkflows`,
 * so the deployed routes may surface 404/501 for some endpoints. The adapter
 * surfaces those errors unchanged through `ActionResult<T>` (Phase 5/6 pattern).
 */

export type WorkflowStepType =
  | 'condition'
  | 'create_record'
  | 'update_field'
  | 'send_notification'
  | 'call_webhook'
  | 'approval_gate';

export type WorkflowTriggerOn = 'create' | 'update' | 'delete' | 'any';

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  config: Record<string, unknown>;
}

/**
 * `layout` is intentionally typed as a loose record so that the editor can
 * roundtrip xyflow `Node[]` / `Edge[]` shapes without coupling the port to a
 * UI dependency. The serializer (in `components/_custom/WorkflowBuilder/`)
 * narrows it to the concrete shape on the way in/out.
 */
export interface WorkflowConfig {
  triggerTableId?: string;
  triggerOn?: WorkflowTriggerOn;
  steps?: WorkflowStep[];
  layout?: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  name: string;
  appId: string;
  status?: string;
  description?: string;
  config?: WorkflowConfig;
  active?: boolean;
  createdAt?: string;
}

export interface StepExecution {
  id: string;
  instanceId: string;
  stepId: string;
  stepType: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error: string | null;
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  triggerRecordId: string | null;
  triggerTableId: string | null;
  status: string;
  currentStepId: string | null;
  context: Record<string, unknown>;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  steps?: StepExecution[];
}

export interface WorkflowTask {
  id: string;
  instanceId: string;
  stepId: string;
  roleName: string;
  prompt: string | null;
  context: Record<string, unknown>;
  status: string;
  assignedTo: string | null;
  actedBy: string | null;
  actedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface StepTraceResult {
  stepId: string;
  stepType: string;
  status: 'completed' | 'failed' | 'skipped' | 'waiting';
  message: string;
  output?: Record<string, unknown>;
}

export interface CreateWorkflowPayload {
  name: string;
  description?: string;
  config?: WorkflowConfig;
  active?: boolean;
}

export type UpdateWorkflowPayload = Partial<CreateWorkflowPayload>;

export interface ListInstancesQuery {
  workflowId?: string;
}

export interface ListTasksQuery {
  role?: string;
  status?: string;
}

export interface IGabWorkflowRepository {
  listWorkflows(appId: string): Promise<Workflow[]>;
  getWorkflow(appId: string, workflowId: string): Promise<Workflow>;
  createWorkflow(appId: string, payload: CreateWorkflowPayload): Promise<Workflow>;
  updateWorkflow(
    appId: string,
    workflowId: string,
    patch: UpdateWorkflowPayload,
  ): Promise<Workflow>;
  deleteWorkflow(appId: string, workflowId: string): Promise<{ ok: boolean }>;
  testWorkflow(
    appId: string,
    workflowId: string,
    recordData: Record<string, unknown>,
  ): Promise<{ results: StepTraceResult[] }>;

  listInstances(
    appId: string,
    query?: ListInstancesQuery,
  ): Promise<WorkflowInstance[]>;
  getInstance(appId: string, instanceId: string): Promise<WorkflowInstance>;

  listTasks(appId: string, query?: ListTasksQuery): Promise<WorkflowTask[]>;
  approveTask(
    appId: string,
    taskId: string,
    payload?: { notes?: string },
  ): Promise<WorkflowTask>;
  rejectTask(
    appId: string,
    taskId: string,
    payload?: { notes?: string },
  ): Promise<WorkflowTask>;
}
