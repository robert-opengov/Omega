import type { IAuthPort } from '../../ports/auth.port';
import type {
  CreateWorkflowPayload,
  IGabWorkflowRepository,
  ListInstancesQuery,
  ListTasksQuery,
  StepExecution,
  StepTraceResult,
  UpdateWorkflowPayload,
  Workflow,
  WorkflowConfig,
  WorkflowInstance,
  WorkflowStep,
  WorkflowTask,
  WorkflowTriggerOn,
} from '../../ports/workflow.repository';
import { GabV2Http } from './_http';

function normalizeStep(raw: any): WorkflowStep {
  return {
    id: String(raw?.id ?? ''),
    type: (raw?.type ?? 'condition') as WorkflowStep['type'],
    config: raw?.config && typeof raw.config === 'object' ? raw.config : {},
  };
}

function normalizeConfig(raw: any): WorkflowConfig | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const stepsRaw = Array.isArray(raw.steps) ? raw.steps : [];
  return {
    triggerTableId:
      typeof raw.triggerTableId === 'string' ? raw.triggerTableId : undefined,
    triggerOn:
      typeof raw.triggerOn === 'string'
        ? (raw.triggerOn as WorkflowTriggerOn)
        : undefined,
    steps: stepsRaw.map(normalizeStep),
    layout:
      raw.layout && typeof raw.layout === 'object'
        ? (raw.layout as Record<string, unknown>)
        : undefined,
  };
}

function normalizeWorkflow(raw: any): Workflow {
  return {
    id: String(raw?.id ?? ''),
    name: String(raw?.name ?? ''),
    appId: String(raw?.appId ?? ''),
    status: raw?.status ? String(raw.status) : undefined,
    description: raw?.description ?? undefined,
    config: normalizeConfig(raw?.config),
    active: raw?.active === undefined ? undefined : Boolean(raw.active),
    createdAt: raw?.createdAt ? String(raw.createdAt) : undefined,
  };
}

function normalizeStepExecution(raw: any): StepExecution {
  return {
    id: String(raw?.id ?? ''),
    instanceId: String(raw?.instanceId ?? ''),
    stepId: String(raw?.stepId ?? ''),
    stepType: String(raw?.stepType ?? ''),
    status: String(raw?.status ?? ''),
    startedAt: raw?.startedAt ?? null,
    completedAt: raw?.completedAt ?? null,
    input:
      raw?.input && typeof raw.input === 'object'
        ? (raw.input as Record<string, unknown>)
        : null,
    output:
      raw?.output && typeof raw.output === 'object'
        ? (raw.output as Record<string, unknown>)
        : null,
    error: raw?.error ?? null,
  };
}

function normalizeInstance(raw: any): WorkflowInstance {
  return {
    id: String(raw?.id ?? ''),
    workflowId: String(raw?.workflowId ?? ''),
    triggerRecordId: raw?.triggerRecordId ?? null,
    triggerTableId: raw?.triggerTableId ?? null,
    status: String(raw?.status ?? ''),
    currentStepId: raw?.currentStepId ?? null,
    context:
      raw?.context && typeof raw.context === 'object'
        ? (raw.context as Record<string, unknown>)
        : {},
    startedAt: String(raw?.startedAt ?? ''),
    completedAt: raw?.completedAt ?? null,
    error: raw?.error ?? null,
    steps: Array.isArray(raw?.steps) ? raw.steps.map(normalizeStepExecution) : undefined,
  };
}

function normalizeTask(raw: any): WorkflowTask {
  return {
    id: String(raw?.id ?? ''),
    instanceId: String(raw?.instanceId ?? ''),
    stepId: String(raw?.stepId ?? ''),
    roleName: String(raw?.roleName ?? ''),
    prompt: raw?.prompt ?? null,
    context:
      raw?.context && typeof raw.context === 'object'
        ? (raw.context as Record<string, unknown>)
        : {},
    status: String(raw?.status ?? ''),
    assignedTo: raw?.assignedTo ?? null,
    actedBy: raw?.actedBy ?? null,
    actedAt: raw?.actedAt ?? null,
    notes: raw?.notes ?? null,
    createdAt: String(raw?.createdAt ?? ''),
  };
}

function normalizeTraceResult(raw: any): StepTraceResult {
  const status = String(raw?.status ?? 'completed') as StepTraceResult['status'];
  return {
    stepId: String(raw?.stepId ?? ''),
    stepType: String(raw?.stepType ?? ''),
    status,
    message: String(raw?.message ?? ''),
    output:
      raw?.output && typeof raw.output === 'object'
        ? (raw.output as Record<string, unknown>)
        : undefined,
  };
}

export class GabWorkflowV2Adapter implements IGabWorkflowRepository {
  private readonly http: GabV2Http;

  constructor(authPort: IAuthPort, apiUrl: string) {
    this.http = new GabV2Http(authPort, apiUrl);
  }

  async listWorkflows(appId: string): Promise<Workflow[]> {
    const res = await this.http.json<{ items?: any[] }>(
      `/v2/apps/${appId}/workflows`,
    );
    return Array.isArray(res?.items) ? res.items.map(normalizeWorkflow) : [];
  }

  async getWorkflow(appId: string, workflowId: string): Promise<Workflow> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/workflows/${workflowId}`,
    );
    return normalizeWorkflow(res);
  }

  async createWorkflow(
    appId: string,
    payload: CreateWorkflowPayload,
  ): Promise<Workflow> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/workflows`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeWorkflow(res);
  }

  async updateWorkflow(
    appId: string,
    workflowId: string,
    patch: UpdateWorkflowPayload,
  ): Promise<Workflow> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/workflows/${workflowId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    );
    return normalizeWorkflow(res);
  }

  async deleteWorkflow(
    appId: string,
    workflowId: string,
  ): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/apps/${appId}/workflows/${workflowId}`, {
      method: 'DELETE',
    });
    return { ok: true };
  }

  async testWorkflow(
    appId: string,
    workflowId: string,
    recordData: Record<string, unknown>,
  ): Promise<{ results: StepTraceResult[] }> {
    const res = await this.http.json<{ results?: any[] }>(
      `/v2/apps/${appId}/workflows/${workflowId}/test`,
      {
        method: 'POST',
        body: JSON.stringify({ recordData }),
      },
    );
    return {
      results: Array.isArray(res?.results)
        ? res.results.map(normalizeTraceResult)
        : [],
    };
  }

  async listInstances(
    appId: string,
    query: ListInstancesQuery = {},
  ): Promise<WorkflowInstance[]> {
    const qs = GabV2Http.qs({ workflowId: query.workflowId });
    const res = await this.http.json<{ items?: any[] }>(
      `/v2/apps/${appId}/workflow-instances${qs}`,
    );
    return Array.isArray(res?.items) ? res.items.map(normalizeInstance) : [];
  }

  async getInstance(
    appId: string,
    instanceId: string,
  ): Promise<WorkflowInstance> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/workflow-instances/${instanceId}`,
    );
    return normalizeInstance(res);
  }

  async listTasks(
    appId: string,
    query: ListTasksQuery = {},
  ): Promise<WorkflowTask[]> {
    const qs = GabV2Http.qs({
      role: query.role,
      status: query.status ?? 'pending',
    });
    const res = await this.http.json<{ items?: any[] }>(
      `/v2/apps/${appId}/workflow-tasks${qs}`,
    );
    return Array.isArray(res?.items) ? res.items.map(normalizeTask) : [];
  }

  async approveTask(
    appId: string,
    taskId: string,
    payload: { notes?: string } = {},
  ): Promise<WorkflowTask> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/workflow-tasks/${taskId}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ notes: payload.notes ?? null }),
      },
    );
    return normalizeTask(res);
  }

  async rejectTask(
    appId: string,
    taskId: string,
    payload: { notes?: string } = {},
  ): Promise<WorkflowTask> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/workflow-tasks/${taskId}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ notes: payload.notes ?? null }),
      },
    );
    return normalizeTask(res);
  }
}

export {
  normalizeWorkflow,
  normalizeInstance,
  normalizeTask,
  normalizeTraceResult,
};
