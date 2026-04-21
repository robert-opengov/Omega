import { beforeEach, describe, expect, it, vi } from 'vitest';

const gabSchemaRepoMock = {
  listFields: vi.fn(),
};

vi.mock('@/lib/core', () => ({
  gabSchemaRepo: gabSchemaRepoMock,
}));

describe('schema actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('listFieldsAction returns the normalized schema result', async () => {
    gabSchemaRepoMock.listFields.mockResolvedValue({
      items: [
        {
          id: 'field_1',
          tableId: 'table_1',
          key: 'status',
          name: 'Status',
          type: 'select',
          required: true,
          sortOrder: 1,
          isSystem: false,
          createdAt: '2026-04-20T00:00:00.000Z',
        },
      ],
      total: 1,
    });

    const { listFieldsAction } = await import('../schema');
    const result = await listFieldsAction('app_1', 'table_1');

    expect(gabSchemaRepoMock.listFields).toHaveBeenCalledWith('app_1', 'table_1');
    expect(result).toEqual({
      success: true,
      data: {
        items: [
          {
            id: 'field_1',
            tableId: 'table_1',
            key: 'status',
            name: 'Status',
            type: 'select',
            required: true,
            sortOrder: 1,
            isSystem: false,
            createdAt: '2026-04-20T00:00:00.000Z',
          },
        ],
        total: 1,
      },
    });
  });

  it('listFieldsAction returns the error contract when the repo throws', async () => {
    gabSchemaRepoMock.listFields.mockRejectedValue(new Error('Schema failed'));

    const { listFieldsAction } = await import('../schema');
    const result = await listFieldsAction('app_1', 'table_1');

    expect(result).toEqual({
      success: false,
      error: 'Schema failed',
    });
  });
});
