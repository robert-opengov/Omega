import { beforeEach, describe, expect, it, vi } from 'vitest';

const BASE_URL = 'https://gab.example.com';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GabUserV2Adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('updates a user through PUT /v2/users/:userId and returns the normalized user', async () => {
    const { GabUserV2Adapter } = await import('../user.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        id: 'user_1',
        email: 'ada@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        active: true,
        isExternalUser: false,
        twoFactorEnabled: true,
        tenantId: 'tenant_1',
        createdAt: '2026-04-20T00:00:00.000Z',
        updatedAt: '2026-04-21T00:00:00.000Z',
      }),
    );

    const adapter = new GabUserV2Adapter(authPort as any, BASE_URL);
    const result = await adapter.updateUser('user_1', {
      firstName: 'Ada',
      twoFactorEnabled: true,
    });

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/users/user_1`);
    expect(init.method).toBe('PUT');
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer access-token');
    expect(JSON.parse(init.body as string)).toEqual({
      firstName: 'Ada',
      twoFactorEnabled: true,
    });
    expect(result).toEqual({
      id: 'user_1',
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      active: true,
      isExternalUser: false,
      twoFactorEnabled: true,
      tenantId: 'tenant_1',
      createdAt: '2026-04-20T00:00:00.000Z',
      updatedAt: '2026-04-21T00:00:00.000Z',
    });
  });

  it('fills safe defaults when optional user fields are missing', async () => {
    const { GabUserV2Adapter } = await import('../user.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        id: 'user_2',
        email: 'grace@example.com',
        firstName: 'Grace',
      }),
    );

    const adapter = new GabUserV2Adapter(authPort as any, BASE_URL);
    const result = await adapter.updateUser('user_2', {});

    expect(result).toEqual({
      id: 'user_2',
      email: 'grace@example.com',
      firstName: 'Grace',
      lastName: '',
      active: false,
      isExternalUser: false,
      twoFactorEnabled: false,
      tenantId: null,
      createdAt: '',
      updatedAt: '',
    });
  });

  it('surfaces backend errors when updateUser fails', async () => {
    const { GabUserV2Adapter } = await import('../user.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'User not found' }, 404),
    );

    const adapter = new GabUserV2Adapter(authPort as any, BASE_URL);
    await expect(adapter.updateUser('missing', {})).rejects.toThrow('User not found');
  });

  it('lists users with serialised query parameters', async () => {
    const { GabUserV2Adapter } = await import('../user.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        items: [
          {
            id: 'user_1',
            email: 'ada@example.com',
            firstName: 'Ada',
            lastName: 'Lovelace',
            active: true,
            twoFactorEnabled: false,
            tenantId: 'tenant_1',
          },
        ],
        total: 1,
        page: 2,
        pageSize: 25,
      }),
    );

    const adapter = new GabUserV2Adapter(authPort as any, BASE_URL);
    const result = await adapter.listUsers({
      search: 'ada',
      tenantId: 'tenant_1',
      active: true,
      page: 2,
      pageSize: 25,
    });

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(`${BASE_URL}/v2/users`);
    expect(parsed.searchParams.get('search')).toBe('ada');
    expect(parsed.searchParams.get('tenantId')).toBe('tenant_1');
    expect(parsed.searchParams.get('active')).toBe('true');
    expect(parsed.searchParams.get('page')).toBe('2');
    expect(parsed.searchParams.get('pageSize')).toBe('25');
    expect((init.method ?? 'GET')).toBe('GET');
    expect(result.total).toBe(1);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(25);
    expect(result.items[0].email).toBe('ada@example.com');
  });

  it('lists users with no query string when query is empty', async () => {
    const { GabUserV2Adapter } = await import('../user.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ items: [], total: 0, page: 1, pageSize: 25 }),
    );

    const adapter = new GabUserV2Adapter(authPort as any, BASE_URL);
    const result = await adapter.listUsers();

    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/users`);
    expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 25 });
  });

  it('coerces missing list fields to safe defaults', async () => {
    const { GabUserV2Adapter } = await import('../user.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}));

    const adapter = new GabUserV2Adapter(authPort as any, BASE_URL);
    const result = await adapter.listUsers({ page: 3, pageSize: 10 });
    expect(result).toEqual({ items: [], total: 0, page: 3, pageSize: 10 });
  });

  it('gets a user by id', async () => {
    const { GabUserV2Adapter } = await import('../user.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        id: 'user_1',
        email: 'ada@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        active: true,
        isExternalUser: true,
        twoFactorEnabled: true,
        tenantId: 'tenant_1',
        createdAt: '2026-04-20T00:00:00.000Z',
        updatedAt: '2026-04-21T00:00:00.000Z',
      }),
    );

    const adapter = new GabUserV2Adapter(authPort as any, BASE_URL);
    const result = await adapter.getUser('user_1');

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/users/user_1`);
    expect((init.method ?? 'GET')).toBe('GET');
    expect(result).toEqual({
      id: 'user_1',
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      active: true,
      isExternalUser: true,
      twoFactorEnabled: true,
      tenantId: 'tenant_1',
      createdAt: '2026-04-20T00:00:00.000Z',
      updatedAt: '2026-04-21T00:00:00.000Z',
    });
  });

  it('surfaces backend errors when getUser fails', async () => {
    const { GabUserV2Adapter } = await import('../user.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'User not found' }, 404),
    );

    const adapter = new GabUserV2Adapter(authPort as any, BASE_URL);
    await expect(adapter.getUser('missing')).rejects.toThrow('User not found');
  });
});
