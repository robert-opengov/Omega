import { beforeEach, describe, expect, it, vi } from 'vitest';

const gabTenantRepoMock = {
  listTenants: vi.fn(),
  getTenant: vi.fn(),
  createTenant: vi.fn(),
  updateTenant: vi.fn(),
  deleteTenant: vi.fn(),
};

vi.mock('@/lib/core', () => ({
  gabTenantRepo: gabTenantRepoMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('tenant actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('listTenantsAction returns repo data', async () => {
    gabTenantRepoMock.listTenants.mockResolvedValue({
      items: [
        { id: 'co_1', name: 'Acme', slug: 'acme', createdAt: '2026-04-20T00:00:00.000Z' },
      ],
      total: 1,
    });

    const { listTenantsAction } = await import('../tenants');
    const res = await listTenantsAction();

    expect(gabTenantRepoMock.listTenants).toHaveBeenCalled();
    expect(res.success).toBe(true);
    expect(res.data?.total).toBe(1);
  });

  it('createTenantAction returns the created tenant', async () => {
    gabTenantRepoMock.createTenant.mockResolvedValue({
      id: 'co_1',
      name: 'Acme',
      slug: 'acme',
    });

    const { createTenantAction } = await import('../tenants');
    const res = await createTenantAction({ name: 'Acme', slug: 'acme' });

    expect(gabTenantRepoMock.createTenant).toHaveBeenCalledWith({
      name: 'Acme',
      slug: 'acme',
    });
    expect(res.success).toBe(true);
    expect(res.data?.id).toBe('co_1');
  });

  it('createTenantAction returns the error contract when creation fails', async () => {
    gabTenantRepoMock.createTenant.mockRejectedValue(new Error('Slug taken'));

    const { createTenantAction } = await import('../tenants');
    const res = await createTenantAction({ name: 'Acme' });

    expect(res).toEqual({ success: false, error: 'Slug taken' });
  });

  it('updateTenantAction returns the updated tenant', async () => {
    gabTenantRepoMock.updateTenant.mockResolvedValue({
      id: 'co_1',
      name: 'Acme Renamed',
    });

    const { updateTenantAction } = await import('../tenants');
    const res = await updateTenantAction('co_1', { name: 'Acme Renamed' });

    expect(gabTenantRepoMock.updateTenant).toHaveBeenCalledWith('co_1', {
      name: 'Acme Renamed',
    });
    expect(res.success).toBe(true);
    expect(res.data?.name).toBe('Acme Renamed');
  });

  it('deleteTenantAction returns ok', async () => {
    gabTenantRepoMock.deleteTenant.mockResolvedValue({ ok: true });

    const { deleteTenantAction } = await import('../tenants');
    const res = await deleteTenantAction('co_1');

    expect(gabTenantRepoMock.deleteTenant).toHaveBeenCalledWith('co_1');
    expect(res).toEqual({ success: true, data: { ok: true } });
  });

  it('deleteTenantAction returns the error contract when deletion fails', async () => {
    gabTenantRepoMock.deleteTenant.mockRejectedValue(new Error('Tenant has apps'));

    const { deleteTenantAction } = await import('../tenants');
    const res = await deleteTenantAction('co_1');

    expect(res).toEqual({ success: false, error: 'Tenant has apps' });
  });

  it('getTenantAction returns a single tenant', async () => {
    gabTenantRepoMock.getTenant.mockResolvedValue({
      id: 'co_1',
      name: 'Acme',
    });

    const { getTenantAction } = await import('../tenants');
    const res = await getTenantAction('co_1');

    expect(gabTenantRepoMock.getTenant).toHaveBeenCalledWith('co_1');
    expect(res.success).toBe(true);
    expect(res.data?.id).toBe('co_1');
  });
});
