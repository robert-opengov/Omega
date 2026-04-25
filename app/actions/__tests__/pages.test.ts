import { describe, it, expect, vi, beforeEach } from 'vitest';

const gabPageRepoMock = {
  listPages: vi.fn(),
  getPage: vi.fn(),
  createPage: vi.fn(),
  updatePage: vi.fn(),
  deletePage: vi.fn(),
  duplicatePage: vi.fn(),
};

vi.mock('@/lib/core', () => ({
  gabPageRepo: gabPageRepoMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('pages actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listPagesAction returns data', async () => {
    gabPageRepoMock.listPages.mockResolvedValue({ items: [], total: 0 });
    const { listPagesAction } = await import('../pages');
    const res = await listPagesAction('app1');
    expect(res.success).toBe(true);
    if (res.success) expect(res.data?.total).toBe(0);
  });
});
