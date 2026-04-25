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

describe('GabTenantV2Adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists tenants and normalises items + total', async () => {
    const { GabTenantV2Adapter } = await import('../tenant.v2.adapter');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        items: [
          { id: 'co_1', name: 'Acme', slug: 'acme', createdAt: '2026-04-20T00:00:00.000Z' },
          { id: 'co_2', name: 'Initech' },
        ],
        total: 2,
      }),
    );

    const adapter = new GabTenantV2Adapter(authPortStub() as never, BASE_URL);
    const result = await adapter.listTenants();

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/companies`);
    expect((init.method ?? 'GET')).toBe('GET');
    expect(result.total).toBe(2);
    expect(result.items[0]).toMatchObject({ id: 'co_1', name: 'Acme', slug: 'acme' });
    expect(result.items[1].slug).toBeUndefined();
  });

  it('coerces missing items to an empty list', async () => {
    const { GabTenantV2Adapter } = await import('../tenant.v2.adapter');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}));

    const adapter = new GabTenantV2Adapter(authPortStub() as never, BASE_URL);
    const result = await adapter.listTenants();

    expect(result).toEqual({ items: [], total: 0 });
  });

  it('gets a tenant by id', async () => {
    const { GabTenantV2Adapter } = await import('../tenant.v2.adapter');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ id: 'co_1', name: 'Acme', slug: 'acme' }),
    );

    const adapter = new GabTenantV2Adapter(authPortStub() as never, BASE_URL);
    const result = await adapter.getTenant('co_1');

    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/companies/co_1`);
    expect(result).toEqual({
      id: 'co_1',
      name: 'Acme',
      slug: 'acme',
      createdAt: undefined,
    });
  });

  it('creates a tenant with the provided payload', async () => {
    const { GabTenantV2Adapter } = await import('../tenant.v2.adapter');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ id: 'co_1', name: 'Acme', slug: 'acme' }),
    );

    const adapter = new GabTenantV2Adapter(authPortStub() as never, BASE_URL);
    const result = await adapter.createTenant({ name: 'Acme', slug: 'acme' });

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/companies`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'Acme', slug: 'acme' });
    expect(result.id).toBe('co_1');
  });

  it('updates a tenant via PATCH', async () => {
    const { GabTenantV2Adapter } = await import('../tenant.v2.adapter');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ id: 'co_1', name: 'Acme Renamed' }),
    );

    const adapter = new GabTenantV2Adapter(authPortStub() as never, BASE_URL);
    const result = await adapter.updateTenant('co_1', { name: 'Acme Renamed' });

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/companies/co_1`);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'Acme Renamed' });
    expect(result.name).toBe('Acme Renamed');
  });

  it('deletes a tenant via DELETE and returns ok', async () => {
    const { GabTenantV2Adapter } = await import('../tenant.v2.adapter');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    const adapter = new GabTenantV2Adapter(authPortStub() as never, BASE_URL);
    const result = await adapter.deleteTenant('co_1');

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/companies/co_1`);
    expect(init.method).toBe('DELETE');
    expect(result).toEqual({ ok: true });
  });

  it('surfaces backend errors when delete fails', async () => {
    const { GabTenantV2Adapter } = await import('../tenant.v2.adapter');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'Tenant has apps' }, 409),
    );

    const adapter = new GabTenantV2Adapter(authPortStub() as never, BASE_URL);
    await expect(adapter.deleteTenant('co_1')).rejects.toThrow('Tenant has apps');
  });
});
