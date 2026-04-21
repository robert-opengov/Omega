import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GabSchemaV2Adapter } from '../schema.v2.adapter';

const BASE_URL = 'https://gab.example.com';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GabSchemaV2Adapter — listFields', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('requests the live v2 fields endpoint and returns items with total', async () => {
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        items: [
          {
            id: 'field_1',
            tableId: 'table_1',
            key: 'status',
            name: 'Status',
            type: 'select',
            required: true,
            sortOrder: 1,
            isSystem: false,
            createdAt: '2026-04-20T00:00:00.000Z',
            formula: null,
            formulaReturnType: null,
            config: { options: ['Draft', 'Active'] },
          },
        ],
        total: 1,
      }),
    );

    const adapter = new GabSchemaV2Adapter(authPort as any, BASE_URL) as any;

    const result = await adapter.listFields('app_1', 'table_1');

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/tables/table_1/fields`);
    expect(init.method).toBe('GET');
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer access-token');
    expect(result.total).toBe(1);
    expect(result.items).toEqual([
      {
        id: 'field_1',
        tableId: 'table_1',
        key: 'status',
        name: 'Status',
        type: 'select',
        required: true,
        sortOrder: 1,
        isSystem: false,
        createdAt: '2026-04-20T00:00:00.000Z',
        formula: null,
        formulaReturnType: null,
        config: { options: ['Draft', 'Active'] },
      },
    ]);
  });

  it('preserves optional advanced field properties when present', async () => {
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        items: [
          {
            id: 'field_2',
            tableId: 'table_1',
            key: 'summary',
            name: 'Summary',
            type: 'summary',
            required: false,
            sortOrder: 2,
            isSystem: false,
            createdAt: '2026-04-20T00:00:00.000Z',
            formula: '1+1',
            formulaReturnType: 'number',
            lookupConfig: { source: 'field_1' },
            summaryConfig: { summaryType: 'count', targetTableKey: 'table_2' },
            defaultValue: '0',
          },
        ],
        total: 1,
      }),
    );

    const adapter = new GabSchemaV2Adapter(authPort as any, BASE_URL) as any;
    const result = await adapter.listFields('app_1', 'table_1');

    expect(result.items[0]).toEqual({
      id: 'field_2',
      tableId: 'table_1',
      key: 'summary',
      name: 'Summary',
      type: 'summary',
      required: false,
      sortOrder: 2,
      isSystem: false,
      createdAt: '2026-04-20T00:00:00.000Z',
      formula: '1+1',
      formulaReturnType: 'number',
      lookupConfig: { source: 'field_1' },
      summaryConfig: { summaryType: 'count', targetTableKey: 'table_2' },
      defaultValue: '0',
    });
  });

  it('surfaces backend errors when listFields fails', async () => {
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'Schema locked' }, 423),
    );

    const adapter = new GabSchemaV2Adapter(authPort as any, BASE_URL) as any;
    await expect(adapter.listFields('app_1', 'table_1')).rejects.toThrow('Schema locked');
  });
});
