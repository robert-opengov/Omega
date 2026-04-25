import { beforeEach, describe, expect, it, vi } from 'vitest';

const BASE_URL = 'https://gab.example.com';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GabFormV2Adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists forms with and without tableId', async () => {
    const { GabFormV2Adapter } = await import('../form.v2.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('access-token') };
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
          items: [{ id: 'form_1', key: 'request', name: 'Request', layout: {}, config: {} }],
          total: 1,
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ items: [], total: 0 }));

    const adapter = new GabFormV2Adapter(authPort as any, BASE_URL);
    const withTable = await adapter.listForms('app_1', { tableId: 'table_1' });
    const withoutTable = await adapter.listForms('app_1');

    const [urlWith] = spy.mock.calls[0] as [string, RequestInit];
    const [urlWithout] = spy.mock.calls[1] as [string, RequestInit];
    expect(urlWith).toBe(`${BASE_URL}/v2/apps/app_1/forms?tableId=table_1`);
    expect(urlWithout).toBe(`${BASE_URL}/v2/apps/app_1/forms`);
    expect(withTable.total).toBe(1);
    expect(withTable.items[0].layout.sections).toEqual([]);
    expect(withoutTable).toEqual({ items: [], total: 0 });
  });

  it('gets, creates, updates, deletes, and sets default form', async () => {
    const { GabFormV2Adapter } = await import('../form.v2.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('access-token') };
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ id: 'form_1', key: 'a', name: 'A', layout: {}, config: {} }))
      .mockResolvedValueOnce(jsonResponse({ id: 'form_2', key: 'b', name: 'B', layout: {}, config: {} }))
      .mockResolvedValueOnce(jsonResponse({ id: 'form_2', key: 'b', name: 'B2', layout: {}, config: {} }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const adapter = new GabFormV2Adapter(authPort as any, BASE_URL);
    const getRes = await adapter.getForm('app_1', 'form_1');
    const createRes = await adapter.createForm('app_1', { name: 'B' });
    const updateRes = await adapter.updateForm('app_1', 'form_2', { name: 'B2' });
    const delRes = await adapter.deleteForm('app_1', 'form_2');
    const defRes = await adapter.setDefaultForm('app_1', 'form_2');

    const [getUrl, getInit] = spy.mock.calls[0] as [string, RequestInit];
    expect(getUrl).toBe(`${BASE_URL}/v2/apps/app_1/forms/form_1`);
    expect(getInit.method ?? 'GET').toBe('GET');

    const [createUrl, createInit] = spy.mock.calls[1] as [string, RequestInit];
    expect(createUrl).toBe(`${BASE_URL}/v2/apps/app_1/forms`);
    expect(createInit.method).toBe('POST');
    expect(JSON.parse(createInit.body as string)).toEqual({ name: 'B' });

    const [updateUrl, updateInit] = spy.mock.calls[2] as [string, RequestInit];
    expect(updateUrl).toBe(`${BASE_URL}/v2/apps/app_1/forms/form_2`);
    expect(updateInit.method).toBe('PATCH');
    expect(JSON.parse(updateInit.body as string)).toEqual({ name: 'B2' });

    const [deleteUrl, deleteInit] = spy.mock.calls[3] as [string, RequestInit];
    expect(deleteUrl).toBe(`${BASE_URL}/v2/apps/app_1/forms/form_2`);
    expect(deleteInit.method).toBe('DELETE');

    const [setDefaultUrl, setDefaultInit] = spy.mock.calls[4] as [string, RequestInit];
    expect(setDefaultUrl).toBe(`${BASE_URL}/v2/apps/app_1/forms/form_2/set-default`);
    expect(setDefaultInit.method).toBe('POST');

    expect(getRes.id).toBe('form_1');
    expect(createRes.name).toBe('B');
    expect(updateRes.name).toBe('B2');
    expect(delRes).toEqual({ ok: true });
    expect(defRes).toEqual({ ok: true });
  });

  it('gets default form by table id', async () => {
    const { GabFormV2Adapter } = await import('../form.v2.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('access-token') };
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ id: 'form_default', key: 'default', name: 'Default', layout: {}, config: {} }),
    );

    const adapter = new GabFormV2Adapter(authPort as any, BASE_URL);
    const result = await adapter.getDefaultForm('app_1', 'table_1');

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/forms/default/table_1`);
    expect(init.method ?? 'GET').toBe('GET');
    expect(result.id).toBe('form_default');
  });

  it('surfaces backend errors', async () => {
    const { GabFormV2Adapter } = await import('../form.v2.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('access-token') };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'Form not found' }, 404),
    );
    const adapter = new GabFormV2Adapter(authPort as any, BASE_URL);
    await expect(adapter.getForm('app_1', 'missing')).rejects.toThrow('Form not found');
  });
});
