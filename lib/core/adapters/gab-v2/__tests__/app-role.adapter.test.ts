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
    expect(init.method ?? 'GET').toBe('GET');
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

  it('updates a role via PATCH', async () => {
    const { GabAppRoleV2Adapter } = await import('../app-role.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('t') };
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        id: 'role_1',
        name: 'Reviewer X',
        description: null,
        isSystem: false,
        createdAt: '2026-04-20T00:00:00.000Z',
      }),
    );
    const adapter = new GabAppRoleV2Adapter(authPort as any, BASE_URL);
    const out = await adapter.updateRole('app_1', 'role_1', { name: 'Reviewer X' });
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/roles/role_1`);
    expect(init.method).toBe('PATCH');
    expect(out.name).toBe('Reviewer X');
  });

  it('deletes a role via DELETE', async () => {
    const { GabAppRoleV2Adapter } = await import('../app-role.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('t') };
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));
    const adapter = new GabAppRoleV2Adapter(authPort as any, BASE_URL);
    const out = await adapter.deleteRole('app_1', 'role_1');
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/roles/role_1`);
    expect(init.method).toBe('DELETE');
    expect(out.ok).toBe(true);
  });

  it('lists role table permissions', async () => {
    const { GabAppRoleV2Adapter } = await import('../app-role.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('t') };
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        items: [
          {
            id: 'p1',
            roleId: 'r1',
            tableId: 't1',
            viewAccess: 'all',
            editAccess: 'custom',
            deleteAccess: 'none',
            viewFilterConfig: null,
            editFilterConfig: { combinator: 'all', conditions: [] },
            deleteFilterConfig: null,
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: false,
            modifyAccess: 'custom',
            createdAt: 'x',
          },
        ],
        total: 1,
      }),
    );
    const adapter = new GabAppRoleV2Adapter(authPort as any, BASE_URL);
    const out = await adapter.listRolePermissions('app_1', 'r1');
    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/roles/r1/tables`);
    expect(out.items[0].editAccess).toBe('custom');
  });

  it('sets a table permission via PATCH /tables/:tableId', async () => {
    const { GabAppRoleV2Adapter } = await import('../app-role.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('t') };
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        id: 'p1',
        roleId: 'r1',
        tableId: 't1',
        viewAccess: 'all',
        editAccess: 'all',
        deleteAccess: 'none',
        viewFilterConfig: null,
        editFilterConfig: null,
        deleteFilterConfig: null,
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: false,
        modifyAccess: 'all',
        createdAt: 'x',
      }),
    );
    const adapter = new GabAppRoleV2Adapter(authPort as any, BASE_URL);
    await adapter.setRolePermission('app_1', 'r1', 't1', {
      viewAccess: 'all',
      canAdd: true,
      editAccess: 'all',
      deleteAccess: 'none',
    });
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/roles/r1/tables/t1`);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toMatchObject({
      viewAccess: 'all',
      canAdd: true,
      editAccess: 'all',
      deleteAccess: 'none',
    });
  });

  it('lists field permissions and PUTs bulk updates', async () => {
    const { GabAppRoleV2Adapter } = await import('../app-role.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('t') };
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        items: [
          {
            id: 'fp1',
            roleId: 'r1',
            tableId: 't1',
            fieldId: 'f1',
            access: 'read',
            createdAt: 'x',
          },
        ],
        total: 1,
      }),
    );
    const adapter = new GabAppRoleV2Adapter(authPort as any, BASE_URL);
    await adapter.setFieldPermissionsBulk('app_1', 'r1', 't1', {
      permissions: [{ fieldId: 'f1', access: 'read' }],
    });
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/roles/r1/tables/t1/fields`);
    expect(init.method).toBe('PUT');
  });

  it('gets and sets the row filter for a table', async () => {
    const { GabAppRoleV2Adapter } = await import('../app-role.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('t') };
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    fetchSpy.mockResolvedValueOnce(
      jsonResponse({
        viewFilterConfig: { combinator: 'all', conditions: [] },
        editFilterConfig: null,
        deleteFilterConfig: null,
      }),
    );
    const adapter = new GabAppRoleV2Adapter(authPort as any, BASE_URL);
    const got = await adapter.getRowFilter('app_1', 'r1', 't1');
    expect(got.viewFilterConfig?.combinator).toBe('all');

    fetchSpy.mockResolvedValueOnce(
      jsonResponse({
        id: 'p1',
        roleId: 'r1',
        tableId: 't1',
        viewAccess: 'custom',
        editAccess: 'none',
        deleteAccess: 'none',
        viewFilterConfig: { combinator: 'all', conditions: [] },
        editFilterConfig: null,
        deleteFilterConfig: null,
        canView: true,
        canAdd: false,
        canEdit: false,
        canDelete: false,
        modifyAccess: 'none',
        createdAt: 'x',
      }),
    );
    const set = await adapter.setRowFilter('app_1', 'r1', 't1', {
      viewFilterConfig: { combinator: 'all', conditions: [] },
      editFilterConfig: null,
      deleteFilterConfig: null,
    });
    expect(set.viewAccess).toBe('custom');
    const [url, init] = fetchSpy.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/roles/r1/tables/t1/row-filter`);
    expect(init.method).toBe('PUT');
  });

  it('lists and sets capabilities', async () => {
    const { GabAppRoleV2Adapter } = await import('../app-role.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('t') };
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    fetchSpy.mockResolvedValueOnce(
      jsonResponse({
        items: [
          {
            id: 'c1',
            roleId: 'r1',
            tableId: 't1',
            capability: 'manage_forms',
            createdAt: 'x',
          },
        ],
        total: 1,
      }),
    );
    const adapter = new GabAppRoleV2Adapter(authPort as any, BASE_URL);
    const out = await adapter.listCapabilities('app_1', 'r1', 't1');
    expect(out.items[0].capability).toBe('manage_forms');

    fetchSpy.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await adapter.setCapabilities('app_1', 'r1', 't1', {
      capabilities: [{ capability: 'manage_forms', enabled: true }],
    });
    const [url, init] = fetchSpy.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/roles/r1/tables/t1/capabilities`);
    expect(init.method).toBe('PUT');
  });

  it('assigns and unassigns a user role', async () => {
    const { GabAppRoleV2Adapter } = await import('../app-role.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('t') };
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy.mockResolvedValueOnce(jsonResponse({ ok: true }));
    fetchSpy.mockResolvedValueOnce(jsonResponse({ ok: true }));
    const adapter = new GabAppRoleV2Adapter(authPort as any, BASE_URL);

    await adapter.assignRole('app_1', 'u1', 'r1');
    const [u1, init1] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(u1).toBe(`${BASE_URL}/v2/apps/app_1/users/u1/roles`);
    expect(init1.method).toBe('POST');
    expect(JSON.parse(init1.body as string)).toEqual({ roleId: 'r1' });

    await adapter.unassignRole('app_1', 'u1', 'r1');
    const [u2, init2] = fetchSpy.mock.calls[1] as [string, RequestInit];
    expect(u2).toBe(`${BASE_URL}/v2/apps/app_1/users/u1/roles/r1`);
    expect(init2.method).toBe('DELETE');
  });

  it('lists app users for the role assignment picker', async () => {
    const { GabAppRoleV2Adapter } = await import('../app-role.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('t') };
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        items: [
          {
            id: 'au1',
            userId: 'u1',
            email: 'a@b.com',
            name: 'A B',
            createdAt: 'x',
          },
        ],
        total: 1,
      }),
    );
    const adapter = new GabAppRoleV2Adapter(authPort as any, BASE_URL);
    const out = await adapter.listAppUsers('app_1');
    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/users`);
    expect(out.items[0].email).toBe('a@b.com');
  });
});
