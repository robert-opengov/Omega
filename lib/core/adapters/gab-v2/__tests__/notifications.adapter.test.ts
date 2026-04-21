import { beforeEach, describe, expect, it, vi } from 'vitest';

const BASE_URL = 'https://gab.example.com';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GabNotificationsV2Adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists notifications without query params in the first pass', async () => {
    const { GabNotificationsV2Adapter } = await import('../notifications.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        items: [{ id: 'notif_1', name: 'Summary' }],
        total: 1,
      }),
    );

    const adapter = new GabNotificationsV2Adapter(authPort as any, BASE_URL);
    const result = await adapter.listNotifications('app_1');

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/notifications`);
    expect(init.method).toBe('GET');
    expect(result).toEqual({
      items: [{ id: 'notif_1', name: 'Summary' }],
      total: 1,
    });
  });

  it('surfaces backend errors when notifications listing fails', async () => {
    const { GabNotificationsV2Adapter } = await import('../notifications.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'Forbidden' }, 403),
    );

    const adapter = new GabNotificationsV2Adapter(authPort as any, BASE_URL);
    await expect(adapter.listNotifications('app_1')).rejects.toThrow('Forbidden');
  });

  it('creates a notification with the required live v2 payload fields', async () => {
    const { GabNotificationsV2Adapter } = await import('../notifications.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        id: 'notif_1',
        tableId: 'table_1',
        name: 'Summary',
        description: null,
        triggerType: 'on_create',
        channel: 'email',
        subjectTemplate: 'Created',
        bodyTemplate: 'A record was created.',
        recipientType: 'all_app_users',
        recipientConfig: {},
        channelConfig: {},
        conditions: null,
        dateCondition: null,
        active: true,
        createdBy: 'user_1',
        createdAt: '2026-04-20T00:00:00.000Z',
        updatedAt: '2026-04-21T00:00:00.000Z',
      }),
    );

    const adapter = new GabNotificationsV2Adapter(authPort as any, BASE_URL);
    await adapter.createNotification('app_1', {
      tableId: 'table_1',
      name: 'Summary',
      triggerType: 'on_create',
      subjectTemplate: 'Created',
      bodyTemplate: 'A record was created.',
      recipientType: 'all_app_users',
      channel: 'email',
    });

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/notifications`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      tableId: 'table_1',
      name: 'Summary',
      triggerType: 'on_create',
      subjectTemplate: 'Created',
      bodyTemplate: 'A record was created.',
      recipientType: 'all_app_users',
      channel: 'email',
    });
  });

  it('gets a single notification by id', async () => {
    const { GabNotificationsV2Adapter } = await import('../notifications.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        id: 'notif_1',
        tableId: 'table_1',
        name: 'Summary',
        description: null,
        triggerType: 'on_create',
        channel: 'email',
        subjectTemplate: 'Created',
        bodyTemplate: 'A record was created.',
        recipientType: 'all_app_users',
        recipientConfig: {},
        channelConfig: {},
        conditions: null,
        dateCondition: null,
        active: true,
        createdBy: 'user_1',
        createdAt: '2026-04-20T00:00:00.000Z',
        updatedAt: '2026-04-21T00:00:00.000Z',
      }),
    );

    const adapter = new GabNotificationsV2Adapter(authPort as any, BASE_URL);
    const result = await adapter.getNotification('app_1', 'notif_1');

    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/notifications/notif_1`);
    expect(result.id).toBe('notif_1');
  });

  it('lists notifications for a table', async () => {
    const { GabNotificationsV2Adapter } = await import('../notifications.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };

    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        items: [
          {
            id: 'notif_1',
            tableId: 'table_1',
            name: 'Summary',
            description: null,
            triggerType: 'on_create',
            channel: 'email',
            subjectTemplate: 'Created',
            bodyTemplate: 'A record was created.',
            recipientType: 'all_app_users',
            recipientConfig: {},
            channelConfig: {},
            conditions: null,
            dateCondition: null,
            active: true,
            createdBy: 'user_1',
            createdAt: '2026-04-20T00:00:00.000Z',
            updatedAt: '2026-04-21T00:00:00.000Z',
          },
        ],
      }),
    );

    const adapter = new GabNotificationsV2Adapter(authPort as any, BASE_URL);
    const result = await adapter.listNotificationsByTable('app_1', 'table_1');

    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/tables/table_1/notifications`);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].tableId).toBe('table_1');
  });
});
