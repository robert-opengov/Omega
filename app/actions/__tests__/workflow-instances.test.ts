import { beforeEach, describe, expect, it, vi } from 'vitest';

const gabWorkflowRepoMock = {
  listInstances: vi.fn(),
  getInstance: vi.fn(),
};

vi.mock('@/lib/core', () => ({
  gabWorkflowRepo: gabWorkflowRepoMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('workflow instance actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('listInstancesAction returns repo data and forwards query', async () => {
    gabWorkflowRepoMock.listInstances.mockResolvedValue([{ id: 'inst_1' }]);
    const { listInstancesAction } = await import('../workflow-instances');
    const res = await listInstancesAction('app_1', { workflowId: 'wf_1' });
    expect(gabWorkflowRepoMock.listInstances).toHaveBeenCalledWith('app_1', {
      workflowId: 'wf_1',
    });
    expect(res.success).toBe(true);
    expect(res.data?.[0].id).toBe('inst_1');
  });

  it('getInstanceAction returns instance', async () => {
    gabWorkflowRepoMock.getInstance.mockResolvedValue({ id: 'inst_1' });
    const { getInstanceAction } = await import('../workflow-instances');
    const res = await getInstanceAction('app_1', 'inst_1');
    expect(gabWorkflowRepoMock.getInstance).toHaveBeenCalledWith('app_1', 'inst_1');
    expect(res.success).toBe(true);
  });

  it('returns error contract on repo failure', async () => {
    gabWorkflowRepoMock.getInstance.mockRejectedValue(new Error('Not found'));
    const { getInstanceAction } = await import('../workflow-instances');
    const res = await getInstanceAction('app_1', 'missing');
    expect(res).toEqual({ success: false, error: 'Not found' });
  });
});
