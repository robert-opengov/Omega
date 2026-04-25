import { beforeEach, describe, expect, it, vi } from 'vitest';

const gabUserRepoMock = {
  listUsers: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
};

vi.mock('@/lib/core', () => ({
  gabUserRepo: gabUserRepoMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('user actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('listUsersAction returns repo data', async () => {
    gabUserRepoMock.listUsers.mockResolvedValue({
      items: [
        {
          id: 'user_1',
          email: 'ada@example.com',
          firstName: 'Ada',
          lastName: 'Lovelace',
          active: true,
          isExternalUser: false,
          twoFactorEnabled: false,
          tenantId: 'tenant_1',
          createdAt: '',
          updatedAt: '',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 25,
    });

    const { listUsersAction } = await import('../users');
    const res = await listUsersAction({ search: 'ada' });

    expect(gabUserRepoMock.listUsers).toHaveBeenCalledWith({ search: 'ada' });
    expect(res.success).toBe(true);
    expect(res.data?.total).toBe(1);
  });

  it('listUsersAction returns the error contract when listing fails', async () => {
    gabUserRepoMock.listUsers.mockRejectedValue(new Error('List failed'));

    const { listUsersAction } = await import('../users');
    const res = await listUsersAction();

    expect(res).toEqual({ success: false, error: 'List failed' });
  });

  it('getUserAction returns a single user', async () => {
    gabUserRepoMock.getUser.mockResolvedValue({
      id: 'user_1',
      email: 'ada@example.com',
    });

    const { getUserAction } = await import('../users');
    const res = await getUserAction('user_1');

    expect(gabUserRepoMock.getUser).toHaveBeenCalledWith('user_1');
    expect(res.success).toBe(true);
    expect(res.data?.id).toBe('user_1');
  });

  it('getUserAction returns the error contract when fetch fails', async () => {
    gabUserRepoMock.getUser.mockRejectedValue(new Error('Not found'));

    const { getUserAction } = await import('../users');
    const res = await getUserAction('missing');

    expect(res).toEqual({ success: false, error: 'Not found' });
  });

  it('updateUserAction returns the updated user', async () => {
    gabUserRepoMock.updateUser.mockResolvedValue({
      id: 'user_1',
      email: 'ada@example.com',
      firstName: 'Ada',
    });

    const { updateUserAction } = await import('../users');
    const res = await updateUserAction('user_1', { firstName: 'Ada' });

    expect(gabUserRepoMock.updateUser).toHaveBeenCalledWith('user_1', {
      firstName: 'Ada',
    });
    expect(res.success).toBe(true);
    expect(res.data?.firstName).toBe('Ada');
  });

  it('updateUserAction returns the error contract when update fails', async () => {
    gabUserRepoMock.updateUser.mockRejectedValue(new Error('Conflict'));

    const { updateUserAction } = await import('../users');
    const res = await updateUserAction('user_1', { firstName: 'Ada' });

    expect(res).toEqual({ success: false, error: 'Conflict' });
  });
});
