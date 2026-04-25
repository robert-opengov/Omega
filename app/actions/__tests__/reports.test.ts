import { beforeEach, describe, expect, it, vi } from 'vitest';

const gabReportRepoMock = {
  listReports: vi.fn(),
  getReport: vi.fn(),
  createReport: vi.fn(),
  updateReport: vi.fn(),
  deleteReport: vi.fn(),
};

vi.mock('@/lib/core', () => ({
  gabReportRepo: gabReportRepoMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('report actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('listReportsAction returns repo data', async () => {
    gabReportRepoMock.listReports.mockResolvedValue([{ id: 'rep_1' }]);
    const { listReportsAction } = await import('../reports');
    const res = await listReportsAction('app_1');
    expect(gabReportRepoMock.listReports).toHaveBeenCalledWith('app_1');
    expect(res.success).toBe(true);
    expect(res.data?.[0].id).toBe('rep_1');
  });

  it('getReportAction returns report', async () => {
    gabReportRepoMock.getReport.mockResolvedValue({ id: 'rep_1' });
    const { getReportAction } = await import('../reports');
    const res = await getReportAction('app_1', 'rep_1');
    expect(gabReportRepoMock.getReport).toHaveBeenCalledWith('app_1', 'rep_1');
    expect(res.success).toBe(true);
  });

  it('createReportAction returns created report', async () => {
    gabReportRepoMock.createReport.mockResolvedValue({ id: 'rep_1', name: 'A' });
    const { createReportAction } = await import('../reports');
    const res = await createReportAction('app_1', { name: 'A', type: 'datatable' });
    expect(gabReportRepoMock.createReport).toHaveBeenCalledWith('app_1', {
      name: 'A',
      type: 'datatable',
    });
    expect(res.success).toBe(true);
    expect(res.data?.id).toBe('rep_1');
  });

  it('updateReportAction returns updated report', async () => {
    gabReportRepoMock.updateReport.mockResolvedValue({ id: 'rep_1', name: 'B' });
    const { updateReportAction } = await import('../reports');
    const res = await updateReportAction('app_1', 'rep_1', { name: 'B' });
    expect(gabReportRepoMock.updateReport).toHaveBeenCalledWith('app_1', 'rep_1', {
      name: 'B',
    });
    expect(res.success).toBe(true);
  });

  it('deleteReportAction returns ok', async () => {
    gabReportRepoMock.deleteReport.mockResolvedValue({ ok: true });
    const { deleteReportAction } = await import('../reports');
    const res = await deleteReportAction('app_1', 'rep_1');
    expect(gabReportRepoMock.deleteReport).toHaveBeenCalledWith('app_1', 'rep_1');
    expect(res).toEqual({ success: true, data: { ok: true } });
  });

  it('returns error contract on repo failure', async () => {
    gabReportRepoMock.updateReport.mockRejectedValue(new Error('Conflict'));
    const { updateReportAction } = await import('../reports');
    const res = await updateReportAction('app_1', 'rep_1', { name: 'Bad' });
    expect(res).toEqual({ success: false, error: 'Conflict' });
  });
});
