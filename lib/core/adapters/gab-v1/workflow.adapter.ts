import type { IAuthPort } from '../../ports/auth.port';
import type {
  CreateWorkflowPayload,
  IGabWorkflowRepository,
  ListInstancesQuery,
  ListTasksQuery,
  StepTraceResult,
  UpdateWorkflowPayload,
  Workflow,
  WorkflowInstance,
  WorkflowTask,
} from '../../ports/workflow.repository';

function notSupported(): Promise<never> {
  return Promise.reject(new Error('Not supported when GAB_API_VERSION=v1'));
}

export class GabWorkflowV1Adapter implements IGabWorkflowRepository {
  constructor(
    private _authPort: IAuthPort,
    private _apiUrl: string,
  ) {}

  listWorkflows(_appId: string): Promise<Workflow[]> {
    return notSupported();
  }

  getWorkflow(_appId: string, _workflowId: string): Promise<Workflow> {
    return notSupported();
  }

  createWorkflow(_appId: string, _payload: CreateWorkflowPayload): Promise<Workflow> {
    return notSupported();
  }

  updateWorkflow(
    _appId: string,
    _workflowId: string,
    _patch: UpdateWorkflowPayload,
  ): Promise<Workflow> {
    return notSupported();
  }

  deleteWorkflow(_appId: string, _workflowId: string): Promise<{ ok: boolean }> {
    return notSupported();
  }

  testWorkflow(
    _appId: string,
    _workflowId: string,
    _recordData: Record<string, unknown>,
  ): Promise<{ results: StepTraceResult[] }> {
    return notSupported();
  }

  listInstances(_appId: string, _query?: ListInstancesQuery): Promise<WorkflowInstance[]> {
    return notSupported();
  }

  getInstance(_appId: string, _instanceId: string): Promise<WorkflowInstance> {
    return notSupported();
  }

  listTasks(_appId: string, _query?: ListTasksQuery): Promise<WorkflowTask[]> {
    return notSupported();
  }

  approveTask(
    _appId: string,
    _taskId: string,
    _payload?: { notes?: string },
  ): Promise<WorkflowTask> {
    return notSupported();
  }

  rejectTask(
    _appId: string,
    _taskId: string,
    _payload?: { notes?: string },
  ): Promise<WorkflowTask> {
    return notSupported();
  }
}
