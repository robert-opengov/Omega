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

describe('GabTemplateV2Adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists templates and normalises versions to numbers', async () => {
    const { GabTemplateV2Adapter } = await import('../template.v2.adapter');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        items: [
          {
            id: 't_1',
            name: 'Permits',
            status: 'published',
            currentVersion: '3',
          },
        ],
        total: '1',
      }),
    );

    const adapter = new GabTemplateV2Adapter(authPortStub() as never, BASE_URL);
    const result = await adapter.listTemplates();

    expect(result.total).toBe(1);
    expect(result.items[0].currentVersion).toBe(3);
    expect(result.items[0].description).toBeNull();
  });

  it('materializes a template with the supplied tenant', async () => {
    const { GabTemplateV2Adapter } = await import('../template.v2.adapter');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ id: 'app_9', key: 'permits-9', name: 'Permits 9' }),
    );

    const adapter = new GabTemplateV2Adapter(authPortStub() as never, BASE_URL);
    const result = await adapter.materialize('t_1', {
      appName: 'Permits 9',
      tenantId: 'co_1',
    });

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/templates/t_1/materialize`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      appName: 'Permits 9',
      tenantId: 'co_1',
    });
    expect(result.id).toBe('app_9');
  });

  it('returns null when an app has no subscription (404)', async () => {
    const { GabTemplateV2Adapter } = await import('../template.v2.adapter');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'Not found' }, 404),
    );

    const adapter = new GabTemplateV2Adapter(authPortStub() as never, BASE_URL);
    const result = await adapter.getAppSubscription('app_x');

    expect(result).toBeNull();
  });

  it('rolls back to a specific version', async () => {
    const { GabTemplateV2Adapter } = await import('../template.v2.adapter');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        id: 'sub_1',
        appId: 'app_1',
        templateId: 't_1',
        appliedVersion: 2,
        updateStatus: 'rolled_back',
        appliedAt: '2026-04-20T00:00:00.000Z',
      }),
    );

    const adapter = new GabTemplateV2Adapter(authPortStub() as never, BASE_URL);
    await adapter.rollbackTemplate('app_1', 2);

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/template-rollback`);
    expect(JSON.parse(init.body as string)).toEqual({ targetVersion: 2 });
  });

  it('publishes a new version with a changelog', async () => {
    const { GabTemplateV2Adapter } = await import('../template.v2.adapter');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}));

    const adapter = new GabTemplateV2Adapter(authPortStub() as never, BASE_URL);
    await adapter.publish('t_1', { changelog: 'Add inspection fields' });

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/templates/t_1/publish`);
    expect(JSON.parse(init.body as string)).toEqual({
      changelog: 'Add inspection fields',
    });
  });
});
