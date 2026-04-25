import { beforeEach, describe, expect, it, vi } from 'vitest';

const gabPublicFormRepoMock = {
  resolvePublicForm: vi.fn(),
  submitPublicForm: vi.fn(),
};

vi.mock('@/lib/core', () => ({
  gabPublicFormRepo: gabPublicFormRepoMock,
}));

describe('public form actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('resolvePublicFormAction omits bearer token', async () => {
    gabPublicFormRepoMock.resolvePublicForm.mockResolvedValue({
      form: { id: 'form_1', key: 'k', name: 'Public', config: {}, layout: { sections: [] } },
      fields: [{ id: 'f1', key: 'name', name: 'Name', type: 'text', required: true }],
      settings: { submitLabel: 'Submit' },
      bearerToken: 'secret-bearer',
    });
    const { resolvePublicFormAction } = await import('../public-forms');
    const res = await resolvePublicFormAction('token_1');
    expect(gabPublicFormRepoMock.resolvePublicForm).toHaveBeenCalledWith('token_1');
    expect(res.success).toBe(true);
    expect(res.data).toEqual({
      form: { id: 'form_1', key: 'k', name: 'Public', config: {}, layout: { sections: [] } },
      fields: [{ id: 'f1', key: 'name', name: 'Name', type: 'text', required: true }],
      settings: { submitLabel: 'Submit' },
    });
  });

  it('submitPublicFormAction re-resolves and forwards bearer', async () => {
    gabPublicFormRepoMock.resolvePublicForm.mockResolvedValue({
      form: { id: 'form_1', key: 'k', name: 'Public', config: {}, layout: { sections: [] } },
      fields: [],
      settings: {},
      bearerToken: 'fresh-bearer',
    });
    gabPublicFormRepoMock.submitPublicForm.mockResolvedValue({
      confirmationMessage: 'Thanks!',
      redirectUrl: 'https://example.com/ok',
    });
    const { submitPublicFormAction } = await import('../public-forms');
    const values = { Name: 'Ada' };
    const res = await submitPublicFormAction('token_1', values);
    expect(gabPublicFormRepoMock.resolvePublicForm).toHaveBeenCalledWith('token_1');
    expect(gabPublicFormRepoMock.submitPublicForm).toHaveBeenCalledWith(
      'token_1',
      'fresh-bearer',
      values,
    );
    expect(res.success).toBe(true);
    expect(res.data?.confirmationMessage).toBe('Thanks!');
  });

  it('returns error contract when submit fails', async () => {
    gabPublicFormRepoMock.resolvePublicForm.mockRejectedValue(new Error('Expired link'));
    const { submitPublicFormAction } = await import('../public-forms');
    const res = await submitPublicFormAction('expired', {});
    expect(res).toEqual({ success: false, error: 'Expired link' });
  });
});
