import { beforeEach, describe, expect, it, vi } from 'vitest';

const gabSandboxRepoMock = {
  createSandbox: vi.fn(),
  getSandboxDiff: vi.fn(),
  promoteSandbox: vi.fn(),
  discardSandbox: vi.fn(),
  listBackups: vi.fn(),
  restoreBackup: vi.fn(),
  exportSchema: vi.fn(),
  importSchema: vi.fn(),
};

vi.mock('@/lib/core', () => ({
  gabSandboxRepo: gabSandboxRepoMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('sandbox actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('exportSchemaAction returns schema payload', async () => {
    gabSandboxRepoMock.exportSchema.mockResolvedValue({ tables: [] });
    const { exportSchemaAction } = await import('../sandbox');
    const res = await exportSchemaAction('app_1');
    expect(gabSandboxRepoMock.exportSchema).toHaveBeenCalledWith('app_1');
    expect(res).toEqual({ success: true, data: { tables: [] } });
  });

  it('importSchemaAction forwards payload and returns result', async () => {
    gabSandboxRepoMock.importSchema.mockResolvedValue({ imported: true });
    const { importSchemaAction } = await import('../sandbox');
    const payload = { tables: [{ key: 'cases' }] };
    const res = await importSchemaAction('app_1', payload);
    expect(gabSandboxRepoMock.importSchema).toHaveBeenCalledWith('app_1', payload);
    expect(res).toEqual({ success: true, data: { imported: true } });
  });

  it('restoreBackupAction keeps error contract', async () => {
    gabSandboxRepoMock.restoreBackup.mockRejectedValue(new Error('Rollback failed'));
    const { restoreBackupAction } = await import('../sandbox');
    const res = await restoreBackupAction('app_1', 'backup_1');
    expect(res).toEqual({ success: false, error: 'Rollback failed' });
  });
});
