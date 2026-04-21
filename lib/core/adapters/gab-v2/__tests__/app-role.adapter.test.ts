import { beforeEach, describe, expect, it, vi } from 'vitest';

const BASE_URL = 'https://gab.example.com';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GabAppRoleV2Adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists app roles and returns items with total', async () => {
    const { GabAppRoleV2Adapter } = await import('../app-role.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        items: [
          {
            id: 'role_1',
            name: 'Reviewer',
            description: 'Can review records',
            isSystem: false,
            createdAt: '2026-04-20T00:00:00.000Z',
          },
        ],
        total: 1,
      }),
    );

    const adapter = new GabAppRoleV2Adapter(authPort as any, BASE_URL);
    const result = await adapter.listRoles('app_1');

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/roles`);
    expect(init.method).toBe('GET');
    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe('Reviewer');
  });

  it('surfaces backend errors when role listing fails', async () => {
    const { GabAppRoleV2Adapter } = await import('../app-role.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'Forbidden' }, 403),
    );

    const adapter = new GabAppRoleV2Adapter(authPort as any, BASE_URL);
    await expect(adapter.listRoles('app_1')).rejects.toThrow('Forbidden');
  });

  it('creates an app role using the live v2 payload shape', async () => {
    const { GabAppRoleV2Adapter } = await import('../app-role.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        id: 'role_1',
        name: 'Reviewer',
        description: 'Can review records',
        isSystem: false,
        createdAt: '2026-04-20T00:00:00.000Z',
      }),
    );

    const adapter = new GabAppRoleV2Adapter(authPort as any, BASE_URL);
    const result = await adapter.createRole('app_1', {
      name: 'Reviewer',
      description: 'Can review records',
    });

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/roles`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'Reviewer',
      description: 'Can review records',
    });
    expect(result.name).toBe('Reviewer');
  });

  it('gets a single app role by id', async () => {
    const { GabAppRoleV2Adapter } = await import('../app-role.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        id: 'role_1',
        name: 'Reviewer',
        description: 'Can review records',
        isSystem: false,
        createdAt: '2026-04-20T00:00:00.000Z',
      }),
    );

    const adapter = new GabAppRoleV2Adapter(authPort as any, BASE_URL);
    const result = await adapter.getRole('app_1', 'role_1');

    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/roles/role_1`);
    expect(result.id).toBe('role_1');
  });
});
