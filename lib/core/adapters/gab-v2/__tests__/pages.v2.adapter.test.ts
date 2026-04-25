import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IAuthPort } from '../../../ports/auth.port';
import { GabPageV2Adapter, normalizePage } from '../pages.v2.adapter';

const authPort = {
  getToken: vi.fn().mockResolvedValue('test-token'),
} as unknown as IAuthPort;

describe('GabPageV2Adapter', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('listPages maps items', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          items: [
            {
              id: '1',
              key: 'pg1',
              name: 'Home',
              slug: 'home',
              icon: null,
              layout: { type: 'grid', rows: [] },
              config: {},
              created_at: '2020-01-01',
              updated_at: '2020-01-02',
            },
          ],
          total: 1,
        }),
    });

    const adapter = new GabPageV2Adapter(authPort, 'https://api.example.com');
    const res = await adapter.listPages('app1');
    expect(res.items).toHaveLength(1);
    expect(res.items[0].key).toBe('pg1');
    expect(res.items[0].createdAt).toBe('2020-01-01');
  });

  it('getPageBySlug uses slug query and returns first item', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          items: [
            {
              id: '7',
              key: 'pg7',
              name: 'Reports',
              slug: 'reports',
              icon: null,
              layout: { type: 'grid', rows: [] },
              config: {},
            },
          ],
          total: 1,
        }),
    });

    const adapter = new GabPageV2Adapter(authPort, 'https://api.example.com');
    const page = await adapter.getPageBySlug('app1', 'reports');
    expect(page?.key).toBe('pg7');
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toContain('/v2/apps/app1/pages?slug=reports');
  });

  it('getPageBySlug falls back to listPages when slug query throws', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal',
        text: () => Promise.resolve('boom'),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            items: [
              {
                id: '9',
                key: 'pg9',
                name: 'Inbox',
                slug: 'inbox',
                icon: null,
                layout: { type: 'grid', rows: [] },
                config: {},
              },
            ],
            total: 1,
          }),
      });

    const adapter = new GabPageV2Adapter(authPort, 'https://api.example.com');
    const page = await adapter.getPageBySlug('app1', 'inbox');
    expect(page?.slug).toBe('inbox');
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(2);
  });

  it('getPageBySlug returns null when no match found', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ items: [], total: 0 }),
    });
    const adapter = new GabPageV2Adapter(authPort, 'https://api.example.com');
    const page = await adapter.getPageBySlug('app1', 'missing');
    expect(page).toBeNull();
  });

  it('createPage POSTs body', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          id: '1',
          key: 'new',
          name: 'N',
          slug: 'n',
          icon: null,
          layout: { type: 'grid', rows: [] },
          config: {},
          created_at: 'a',
          updated_at: 'b',
        }),
    });

    const adapter = new GabPageV2Adapter(authPort, 'https://api.example.com');
    await adapter.createPage('app1', { name: 'N', slug: 'n' });
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toContain('/v2/apps/app1/pages');
    expect((call[1] as RequestInit).method).toBe('POST');
  });
});

describe('normalizePage', () => {
  it('defaults empty layout to grid', () => {
    const p = normalizePage({ id: '1', key: 'k', name: 'n', slug: 's' });
    expect(p.layout).toEqual({ type: 'grid', rows: [] });
  });
});
