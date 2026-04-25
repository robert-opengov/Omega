import { beforeEach, describe, expect, it, vi } from 'vitest';

const gabWorkflowRepoMock = {
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

describe('workflow task actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('listTasksAction returns repo data and forwards query', async () => {
    gabWorkflowRepoMock.listTasks.mockResolvedValue([{ id: 'task_1' }]);
    const { listTasksAction } = await import('../workflow-tasks');
    const res = await listTasksAction('app_1', { role: 'Manager', status: 'pending' });
    expect(gabWorkflowRepoMock.listTasks).toHaveBeenCalledWith('app_1', {
      role: 'Manager',
      status: 'pending',
    });
    expect(res.success).toBe(true);
    expect(res.data?.[0].id).toBe('task_1');
  });

  it('approveTaskAction forwards notes payload', async () => {
    gabWorkflowRepoMock.approveTask.mockResolvedValue({ id: 'task_1', status: 'approved' });
    const { approveTaskAction } = await import('../workflow-tasks');
    const res = await approveTaskAction('app_1', 'task_1', { notes: 'looks good' });
    expect(gabWorkflowRepoMock.approveTask).toHaveBeenCalledWith('app_1', 'task_1', {
      notes: 'looks good',
    });
    expect(res.success).toBe(true);
    expect(res.data?.status).toBe('approved');
  });

  it('rejectTaskAction forwards notes payload', async () => {
    gabWorkflowRepoMock.rejectTask.mockResolvedValue({ id: 'task_1', status: 'rejected' });
    const { rejectTaskAction } = await import('../workflow-tasks');
    const res = await rejectTaskAction('app_1', 'task_1', { notes: 'denied' });
    expect(gabWorkflowRepoMock.rejectTask).toHaveBeenCalledWith('app_1', 'task_1', {
      notes: 'denied',
    });
    expect(res.success).toBe(true);
    expect(res.data?.status).toBe('rejected');
  });

  it('approve / reject default to empty payload', async () => {
    gabWorkflowRepoMock.approveTask.mockResolvedValue({ id: 'task_1' });
    gabWorkflowRepoMock.rejectTask.mockResolvedValue({ id: 'task_1' });
    const { approveTaskAction, rejectTaskAction } = await import('../workflow-tasks');
    await approveTaskAction('app_1', 'task_1');
    await rejectTaskAction('app_1', 'task_1');
    expect(gabWorkflowRepoMock.approveTask).toHaveBeenCalledWith('app_1', 'task_1', {});
    expect(gabWorkflowRepoMock.rejectTask).toHaveBeenCalledWith('app_1', 'task_1', {});
  });

  it('returns error contract on repo failure', async () => {
    gabWorkflowRepoMock.approveTask.mockRejectedValue(new Error('Forbidden'));
    const { approveTaskAction } = await import('../workflow-tasks');
    const res = await approveTaskAction('app_1', 'task_1');
    expect(res).toEqual({ success: false, error: 'Forbidden' });
  });
});
