import { beforeEach, describe, expect, it, vi } from 'vitest';

const BASE_URL = 'https://gab.example.com';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GabReportV2Adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists reports and normalises items', async () => {
    const { GabReportV2Adapter } = await import('../report.v2.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('access-token') };
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        items: [
          {
            id: 'rep_1',
            key: 'rep_1',
            name: 'Sales by region',
            type: 'chart',
            tableId: 'table_1',
            appId: 'app_1',
            config: { chartType: 'bar', xAxis: 'region', yAxis: 'amount' },
            createdAt: '2026-01-01',
          },
          {
            id: 'rep_2',
            key: 'rep_2',
            name: 'Pipeline',
            tableId: 'table_2',
            appId: 'app_1',
          },
        ],
      }),
    );

    const adapter = new GabReportV2Adapter(authPort as any, BASE_URL);
    const reports = await adapter.listReports('app_1');

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/reports`);
    expect((init.method ?? 'GET').toString().toUpperCase()).toBe('GET');

    expect(reports).toHaveLength(2);
    expect(reports[0]).toMatchObject({
      id: 'rep_1',
      name: 'Sales by region',
      type: 'chart',
      tableId: 'table_1',
      appId: 'app_1',
    });
    expect(reports[0].config).toEqual({
      chartType: 'bar',
      xAxis: 'region',
      yAxis: 'amount',
    });
    expect(reports[1].type).toBeUndefined();
    expect(reports[1].config).toBeUndefined();
  });

  it('returns an empty array when the response shape is missing items', async () => {
    const { GabReportV2Adapter } = await import('../report.v2.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('access-token') };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse({}));

    const adapter = new GabReportV2Adapter(authPort as any, BASE_URL);
    const reports = await adapter.listReports('app_1');
    expect(reports).toEqual([]);
  });

  it('drops unknown report types during normalisation', async () => {
    const { GabReportV2Adapter } = await import('../report.v2.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('access-token') };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        items: [
          { id: 'rep_x', key: 'rep_x', appId: 'app_1', name: 'Bad', type: 'dashboard' },
        ],
      }),
    );

    const adapter = new GabReportV2Adapter(authPort as any, BASE_URL);
    const [report] = await adapter.listReports('app_1');
    expect(report.type).toBeUndefined();
  });

  it('gets, creates, updates, and deletes reports', async () => {
    const { GabReportV2Adapter } = await import('../report.v2.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('access-token') };
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'rep_1',
          key: 'rep_1',
          name: 'A',
          appId: 'app_1',
          type: 'datatable',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'rep_2',
          key: 'rep_2',
          name: 'B',
          appId: 'app_1',
          type: 'chart',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'rep_2',
          key: 'rep_2',
          name: 'B2',
          appId: 'app_1',
          type: 'chart',
          config: { chartType: 'line' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const adapter = new GabReportV2Adapter(authPort as any, BASE_URL);
    const getRes = await adapter.getReport('app_1', 'rep_1');
    const createRes = await adapter.createReport('app_1', {
      name: 'B',
      type: 'chart',
      tableId: 'table_2',
    });
    const updateRes = await adapter.updateReport('app_1', 'rep_2', {
      name: 'B2',
      config: { chartType: 'line' },
    });
    const delRes = await adapter.deleteReport('app_1', 'rep_2');

    const [getUrl, getInit] = spy.mock.calls[0] as [string, RequestInit];
    expect(getUrl).toBe(`${BASE_URL}/v2/apps/app_1/reports/rep_1`);
    expect(getInit.method ?? 'GET').toBe('GET');

    const [createUrl, createInit] = spy.mock.calls[1] as [string, RequestInit];
    expect(createUrl).toBe(`${BASE_URL}/v2/apps/app_1/reports`);
    expect(createInit.method).toBe('POST');
    expect(JSON.parse(createInit.body as string)).toEqual({
      name: 'B',
      type: 'chart',
      tableId: 'table_2',
    });

    const [updateUrl, updateInit] = spy.mock.calls[2] as [string, RequestInit];
    expect(updateUrl).toBe(`${BASE_URL}/v2/apps/app_1/reports/rep_2`);
    expect(updateInit.method).toBe('PATCH');
    expect(JSON.parse(updateInit.body as string)).toEqual({
      name: 'B2',
      config: { chartType: 'line' },
    });

    const [deleteUrl, deleteInit] = spy.mock.calls[3] as [string, RequestInit];
    expect(deleteUrl).toBe(`${BASE_URL}/v2/apps/app_1/reports/rep_2`);
    expect(deleteInit.method).toBe('DELETE');

    expect(getRes.id).toBe('rep_1');
    expect(createRes.name).toBe('B');
    expect(updateRes.config).toEqual({ chartType: 'line' });
    expect(delRes).toEqual({ ok: true });
  });

  it('surfaces backend errors', async () => {
    const { GabReportV2Adapter } = await import('../report.v2.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('access-token') };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'Report not found' }, 404),
    );
    const adapter = new GabReportV2Adapter(authPort as any, BASE_URL);
    await expect(adapter.getReport('app_1', 'missing')).rejects.toThrow(
      'Report not found',
    );
  });
});
