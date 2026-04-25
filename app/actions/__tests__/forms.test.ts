import { beforeEach, describe, expect, it, vi } from 'vitest';

const gabFormRepoMock = {
  listForms: vi.fn(),
  getForm: vi.fn(),
  createForm: vi.fn(),
  updateForm: vi.fn(),
  deleteForm: vi.fn(),
  setDefaultForm: vi.fn(),
  getDefaultForm: vi.fn(),
};

vi.mock('@/lib/core', () => ({
  gabFormRepo: gabFormRepoMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('form actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('listFormsAction returns repo data', async () => {
    gabFormRepoMock.listForms.mockResolvedValue({ items: [{ id: 'form_1' }], total: 1 });
    const { listFormsAction } = await import('../forms');
    const res = await listFormsAction('app_1', { tableId: 'table_1' });
    expect(gabFormRepoMock.listForms).toHaveBeenCalledWith('app_1', { tableId: 'table_1' });
    expect(res.success).toBe(true);
    expect(res.data?.total).toBe(1);
  });

  it('getFormAction returns form', async () => {
    gabFormRepoMock.getForm.mockResolvedValue({ id: 'form_1' });
    const { getFormAction } = await import('../forms');
    const res = await getFormAction('app_1', 'form_1');
    expect(gabFormRepoMock.getForm).toHaveBeenCalledWith('app_1', 'form_1');
    expect(res.success).toBe(true);
  });

  it('createFormAction returns created form', async () => {
    gabFormRepoMock.createForm.mockResolvedValue({ id: 'form_1', name: 'Request' });
    const { createFormAction } = await import('../forms');
    const res = await createFormAction('app_1', { name: 'Request' });
    expect(gabFormRepoMock.createForm).toHaveBeenCalledWith('app_1', { name: 'Request' });
    expect(res.success).toBe(true);
    expect(res.data?.id).toBe('form_1');
  });

  it('updateFormAction returns updated form', async () => {
    gabFormRepoMock.updateForm.mockResolvedValue({ id: 'form_1', name: 'Updated' });
    const { updateFormAction } = await import('../forms');
    const res = await updateFormAction('app_1', 'form_1', { name: 'Updated' });
    expect(gabFormRepoMock.updateForm).toHaveBeenCalledWith('app_1', 'form_1', { name: 'Updated' });
    expect(res.success).toBe(true);
  });

  it('deleteFormAction returns ok', async () => {
    gabFormRepoMock.deleteForm.mockResolvedValue({ ok: true });
    const { deleteFormAction } = await import('../forms');
    const res = await deleteFormAction('app_1', 'form_1');
    expect(gabFormRepoMock.deleteForm).toHaveBeenCalledWith('app_1', 'form_1');
    expect(res).toEqual({ success: true, data: { ok: true } });
  });

  it('setDefaultFormAction returns ok', async () => {
    gabFormRepoMock.setDefaultForm.mockResolvedValue({ ok: true });
    const { setDefaultFormAction } = await import('../forms');
    const res = await setDefaultFormAction('app_1', 'form_1');
    expect(gabFormRepoMock.setDefaultForm).toHaveBeenCalledWith('app_1', 'form_1');
    expect(res.success).toBe(true);
  });

  it('getDefaultFormAction returns default form', async () => {
    gabFormRepoMock.getDefaultForm.mockResolvedValue({ id: 'form_default' });
    const { getDefaultFormAction } = await import('../forms');
    const res = await getDefaultFormAction('app_1', 'table_1');
    expect(gabFormRepoMock.getDefaultForm).toHaveBeenCalledWith('app_1', 'table_1');
    expect(res.success).toBe(true);
  });

  it('returns error contract on repo failure', async () => {
    gabFormRepoMock.updateForm.mockRejectedValue(new Error('Conflict'));
    const { updateFormAction } = await import('../forms');
    const res = await updateFormAction('app_1', 'form_1', { name: 'Bad' });
    expect(res).toEqual({ success: false, error: 'Conflict' });
  });
});
