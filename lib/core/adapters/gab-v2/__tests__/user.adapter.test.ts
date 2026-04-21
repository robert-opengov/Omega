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
});
