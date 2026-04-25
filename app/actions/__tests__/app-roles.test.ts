import { beforeEach, describe, expect, it, vi } from 'vitest';

const gabAppRoleRepoMock = {
  listRoles: vi.fn(),
  createRole: vi.fn(),
  getRole: vi.fn(),
};

vi.mock('@/lib/core', () => ({
  gabAppRoleRepo: gabAppRoleRepoMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('app-role actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('listAppRolesAction returns repo data', async () => {
    gabAppRoleRepoMock.listRoles.mockResolvedValue({
      items: [
        {
          id: 'role_1',
          name: 'Reviewer',
          description: 'Can review records',
          isSystem: false,
          createdAt: '2026-04-20T00:00:00.000Z',
        },
      ],
      total: 1,
    });

    const { listAppRolesAction } = await import('../app-roles');
    const result = await listAppRolesAction('app_1');

    expect(gabAppRoleRepoMock.listRoles).toHaveBeenCalledWith('app_1');
    expect(result.success).toBe(true);
    expect(result.data?.total).toBe(1);
  });

  it('listAppRolesAction returns the error contract when listing fails', async () => {
    gabAppRoleRepoMock.listRoles.mockRejectedValue(new Error('Role list failed'));

    const { listAppRolesAction } = await import('../app-roles');
    const result = await listAppRolesAction('app_1');

    expect(result).toEqual({
      success: false,
      error: 'Role list failed',
    });
  });

  it('createAppRoleAction returns the created role', async () => {
    gabAppRoleRepoMock.createRole.mockResolvedValue({
      id: 'role_1',
      name: 'Reviewer',
      description: 'Can review records',
      isSystem: false,
      createdAt: '2026-04-20T00:00:00.000Z',
    });

    const { createAppRoleAction } = await import('../app-roles');
    const result = await createAppRoleAction('app_1', {
      name: 'Reviewer',
      description: 'Can review records',
    });

    expect(gabAppRoleRepoMock.createRole).toHaveBeenCalledWith('app_1', {
      name: 'Reviewer',
      description: 'Can review records',
    });
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('Reviewer');
  });

  it('createAppRoleAction returns the error contract when creation fails', async () => {
    gabAppRoleRepoMock.createRole.mockRejectedValue(new Error('Role create failed'));

    const { createAppRoleAction } = await import('../app-roles');
    const result = await createAppRoleAction('app_1', {
      name: 'Reviewer',
    });

    expect(result).toEqual({
      success: false,
      error: 'Role create failed',
    });
  });

  it('getAppRoleAction returns a single role', async () => {
    gabAppRoleRepoMock.getRole.mockResolvedValue({
      id: 'role_1',
      name: 'Reviewer',
      description: 'Can review records',
      isSystem: false,
      createdAt: '2026-04-20T00:00:00.000Z',
    });

    const { getAppRoleAction } = await import('../app-roles');
    const result = await getAppRoleAction('app_1', 'role_1');

    expect(gabAppRoleRepoMock.getRole).toHaveBeenCalledWith('app_1', 'role_1');
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('role_1');
  });

  it('getAppRoleAction returns the error contract when fetch fails', async () => {
    gabAppRoleRepoMock.getRole.mockRejectedValue(new Error('Role fetch failed'));

    const { getAppRoleAction } = await import('../app-roles');
    const result = await getAppRoleAction('app_1', 'role_1');

    expect(result).toEqual({
      success: false,
      error: 'Role fetch failed',
    });
  });
});
