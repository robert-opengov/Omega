import { beforeEach, describe, expect, it, vi } from 'vitest';

const BASE_URL = 'https://gab.example.com';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function authPortStub() {
  return { getToken: vi.fn().mockResolvedValue('access-token') } as unknown;
}

describe('GabAppV2Adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists apps and normalises items + total', async () => {
    const { GabAppV2Adapter } = await import('../app.v2.adapter');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        items: [
          { id: 'app_1', key: 'permits', name: 'Permits', timezone: 'UTC' },
          { id: 'app_2', name: 'No-key' },
        ],
        total: 2,
      }),
    );

    const adapter = new GabAppV2Adapter(authPortStub() as never, BASE_URL);
    const result = await adapter.listApps();

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps`);
    expect(init?.method).toBeUndefined();
    expect(result.total).toBe(2);
    expect(result.items[0]).toMatchObject({ id: 'app_1', key: 'permits' });
    // key falls back to id when missing
    expect(result.items[1].key).toBe('app_2');
  });

  it('appends companyId as a query param when provided', async () => {
    const { GabAppV2Adapter } = await import('../app.v2.adapter');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ items: [], total: 0 }),
    );

    const adapter = new GabAppV2Adapter(authPortStub() as never, BASE_URL);
    await adapter.listApps('co_1');

    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps?companyId=co_1`);
  });

  it('creates an app with the provided payload', async () => {
    const { GabAppV2Adapter } = await import('../app.v2.adapter');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ id: 'app_9', key: 'new-app', name: 'New' }),
    );

    const adapter = new GabAppV2Adapter(authPortStub() as never, BASE_URL);
    const result = await adapter.createApp({
      name: 'New',
      tenantId: 'co_1',
    });

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'New',
      tenantId: 'co_1',
    });
    expect(result.id).toBe('app_9');
  });

  it('surfaces a backend error message when fetch fails', async () => {
    const { GabAppV2Adapter } = await import('../app.v2.adapter');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'App not found' }, 404),
    );

    const adapter = new GabAppV2Adapter(authPortStub() as never, BASE_URL);
    await expect(adapter.getApp('app_x')).rejects.toThrow('App not found');
  });

  it('hits the dependency-graph endpoint', async () => {
    const { GabAppV2Adapter } = await import('../app.v2.adapter');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        nodes: [],
        edges: [],
        complexity: {
          score: 0,
          level: 'low',
          totalNodes: 0,
          edgeCount: 0,
          depth: 0,
          clusters: 0,
          formulas: 0,
          lookups: 0,
          summaries: 0,
        },
      }),
    );

    const adapter = new GabAppV2Adapter(authPortStub() as never, BASE_URL);
    await adapter.getDependencyGraph('app_1');

    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/dependency-graph`);
  });
});
