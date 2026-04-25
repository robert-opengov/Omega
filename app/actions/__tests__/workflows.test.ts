import { beforeEach, describe, expect, it, vi } from 'vitest';

const gabWorkflowRepoMock = {
  listWorkflows: vi.fn(),
  getWorkflow: vi.fn(),
  createWorkflow: vi.fn(),
  updateWorkflow: vi.fn(),
  deleteWorkflow: vi.fn(),
  testWorkflow: vi.fn(),
  listInstances: vi.fn(),
  getInstance: vi.fn(),
  listTasks: vi.fn(),
  approveTask: vi.fn(),
  rejectTask: vi.fn(),
};

vi.mock('@/lib/core', () => ({
  gabWorkflowRepo: gabWorkflowRepoMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('workflow actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('listWorkflowsAction returns repo data', async () => {
    gabWorkflowRepoMock.listWorkflows.mockResolvedValue([{ id: 'wf_1' }]);
    const { listWorkflowsAction } = await import('../workflows');
    const res = await listWorkflowsAction('app_1');
    expect(gabWorkflowRepoMock.listWorkflows).toHaveBeenCalledWith('app_1');
    expect(res.success).toBe(true);
    expect(res.data?.[0].id).toBe('wf_1');
  });

  it('getWorkflowAction returns workflow', async () => {
    gabWorkflowRepoMock.getWorkflow.mockResolvedValue({ id: 'wf_1' });
    const { getWorkflowAction } = await import('../workflows');
    const res = await getWorkflowAction('app_1', 'wf_1');
    expect(gabWorkflowRepoMock.getWorkflow).toHaveBeenCalledWith('app_1', 'wf_1');
    expect(res.success).toBe(true);
  });

  it('createWorkflowAction returns created workflow', async () => {
    gabWorkflowRepoMock.createWorkflow.mockResolvedValue({ id: 'wf_1', name: 'A' });
    const { createWorkflowAction } = await import('../workflows');
    const res = await createWorkflowAction('app_1', { name: 'A' });
    expect(gabWorkflowRepoMock.createWorkflow).toHaveBeenCalledWith('app_1', { name: 'A' });
    expect(res.success).toBe(true);
    expect(res.data?.id).toBe('wf_1');
  });

  it('updateWorkflowAction returns updated workflow', async () => {
    gabWorkflowRepoMock.updateWorkflow.mockResolvedValue({ id: 'wf_1', name: 'B' });
    const { updateWorkflowAction } = await import('../workflows');
    const res = await updateWorkflowAction('app_1', 'wf_1', { name: 'B' });
    expect(gabWorkflowRepoMock.updateWorkflow).toHaveBeenCalledWith('app_1', 'wf_1', { name: 'B' });
    expect(res.success).toBe(true);
  });

  it('deleteWorkflowAction returns ok', async () => {
    gabWorkflowRepoMock.deleteWorkflow.mockResolvedValue({ ok: true });
    const { deleteWorkflowAction } = await import('../workflows');
    const res = await deleteWorkflowAction('app_1', 'wf_1');
    expect(gabWorkflowRepoMock.deleteWorkflow).toHaveBeenCalledWith('app_1', 'wf_1');
    expect(res).toEqual({ success: true, data: { ok: true } });
  });

  it('testWorkflowAction returns trace results', async () => {
    gabWorkflowRepoMock.testWorkflow.mockResolvedValue({
      results: [{ stepId: 's1', stepType: 'condition', status: 'completed', message: 'ok' }],
    });
    const { testWorkflowAction } = await import('../workflows');
    const res = await testWorkflowAction('app_1', 'wf_1', { foo: 'bar' });
    expect(gabWorkflowRepoMock.testWorkflow).toHaveBeenCalledWith('app_1', 'wf_1', { foo: 'bar' });
    expect(res.success).toBe(true);
    expect(res.data?.results).toHaveLength(1);
  });

  it('returns error contract on repo failure', async () => {
    gabWorkflowRepoMock.updateWorkflow.mockRejectedValue(new Error('Conflict'));
    const { updateWorkflowAction } = await import('../workflows');
    const res = await updateWorkflowAction('app_1', 'wf_1', { name: 'Bad' });
    expect(res).toEqual({ success: false, error: 'Conflict' });
  });
});
