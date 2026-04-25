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

describe('GabSandboxV2Adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a sandbox with the includeData flag forwarded', async () => {
    const { GabSandboxV2Adapter } = await import('../sandbox.v2.adapter');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ appId: 'sb_1', appKey: 'permits-sandbox', dbName: 'db_x' }),
    );

    const adapter = new GabSandboxV2Adapter(authPortStub() as never, BASE_URL);
    const result = await adapter.createSandbox('app_1', {
      name: 'Permits sandbox',
      includeData: true,
    });

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/sandbox`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'Permits sandbox',
      includeData: true,
    });
    expect(result.appId).toBe('sb_1');
  });

  it('promotes a sandbox with selected changes', async () => {
    const { GabSandboxV2Adapter } = await import('../sandbox.v2.adapter');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ promoted: true }),
    );

    const adapter = new GabSandboxV2Adapter(authPortStub() as never, BASE_URL);
    await adapter.promoteSandbox('sb_1', {
      deleteSandbox: true,
      selectedChanges: [
        { category: 'fields', action: 'added', key: 'email' },
      ],
    });

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/sb_1/sandbox/promote`);
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.deleteSandbox).toBe(true);
    expect(body.selectedChanges).toHaveLength(1);
  });

  it('discards a sandbox via DELETE', async () => {
    const { GabSandboxV2Adapter } = await import('../sandbox.v2.adapter');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ discarded: true }),
    );

    const adapter = new GabSandboxV2Adapter(authPortStub() as never, BASE_URL);
    const result = await adapter.discardSandbox('sb_1');

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/sb_1/sandbox`);
    expect(init.method).toBe('DELETE');
    expect(result.discarded).toBe(true);
  });

  it('coerces missing items to an empty backups array', async () => {
    const { GabSandboxV2Adapter } = await import('../sandbox.v2.adapter');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}));

    const adapter = new GabSandboxV2Adapter(authPortStub() as never, BASE_URL);
    const result = await adapter.listBackups('app_1');

    expect(result.items).toEqual([]);
  });

  it('omits backupId from the body when not supplied', async () => {
    const { GabSandboxV2Adapter } = await import('../sandbox.v2.adapter');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ rolledBack: true }),
    );

    const adapter = new GabSandboxV2Adapter(authPortStub() as never, BASE_URL);
    await adapter.restoreBackup('app_1');

    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({});
  });
});
