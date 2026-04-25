import { beforeEach, describe, expect, it, vi } from 'vitest';

const BASE_URL = 'https://gab.example.com';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GabPublicFormV2Adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves public form without auth header', async () => {
    const { GabPublicFormV2Adapter } = await import('../public-form.v2.adapter');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        type: 'form',
        form: {
          id: 'form_1',
          key: 'request',
          name: 'Request',
          tableId: 'table_1',
          layout: {},
          config: {},
          isDefault: false,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        fields: [{ id: 'f1', key: 'name', name: 'Name', type: 'text', required: true }],
        settings: { submitLabel: 'Send' },
        bearerToken: 'public-bearer',
      }),
    );

    const adapter = new GabPublicFormV2Adapter(BASE_URL);
    const result = await adapter.resolvePublicForm('token_1');

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(url).toBe(`${BASE_URL}/v2/public/token_1`);
    expect(init.method).toBe('GET');
    expect(headers.get('Authorization')).toBeNull();
    expect(result.bearerToken).toBe('public-bearer');
    expect(result.fields[0].key).toBe('name');
  });

  it('submits with bearer auth and strips honeypot', async () => {
    const { GabPublicFormV2Adapter } = await import('../public-form.v2.adapter');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ confirmationMessage: 'Submitted', redirectUrl: 'https://example.com/ok' }),
    );

    const adapter = new GabPublicFormV2Adapter(BASE_URL);
    const result = await adapter.submitPublicForm('token_1', 'public-bearer', {
      Name: 'Ada',
      __honeypot: 'bot-value',
    });

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(url).toBe(`${BASE_URL}/v2/public/token_1/submit`);
    expect(init.method).toBe('POST');
    expect(headers.get('Authorization')).toBe('Bearer public-bearer');
    expect(JSON.parse(init.body as string)).toEqual({ Name: 'Ada' });
    expect(result).toEqual({
      confirmationMessage: 'Submitted',
      redirectUrl: 'https://example.com/ok',
    });
  });

  it('surfaces backend errors', async () => {
    const { GabPublicFormV2Adapter } = await import('../public-form.v2.adapter');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'Link expired' }, 410),
    );

    const adapter = new GabPublicFormV2Adapter(BASE_URL);
    await expect(adapter.resolvePublicForm('expired')).rejects.toThrow('Link expired');
  });
});
