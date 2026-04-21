import { beforeEach, describe, expect, it, vi } from 'vitest';

const gabNotificationRepoMock = {
  listNotifications: vi.fn(),
  createNotification: vi.fn(),
  getNotification: vi.fn(),
  listNotificationsByTable: vi.fn(),
};

vi.mock('@/lib/core', () => ({
  gabNotificationRepo: gabNotificationRepoMock,
}));

describe('notification actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('listNotificationsAction returns repo data', async () => {
    gabNotificationRepoMock.listNotifications.mockResolvedValue({
      items: [{ id: 'notif_1', name: 'Summary' }],
      total: 1,
    });

    const { listNotificationsAction } = await import('../notifications');
    const result = await listNotificationsAction('app_1');

    expect(gabNotificationRepoMock.listNotifications).toHaveBeenCalledWith('app_1');
    expect(result).toEqual({
      success: true,
      data: {
        items: [{ id: 'notif_1', name: 'Summary' }],
        total: 1,
      },
    });
  });

  it('listNotificationsAction returns the error contract when listing fails', async () => {
    gabNotificationRepoMock.listNotifications.mockRejectedValue(new Error('List failed'));

    const { listNotificationsAction } = await import('../notifications');
    const result = await listNotificationsAction('app_1');

    expect(result).toEqual({
      success: false,
      error: 'List failed',
    });
  });

  it('createNotificationAction returns the created notification', async () => {
    gabNotificationRepoMock.createNotification.mockResolvedValue({
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
    });

    const { createNotificationAction } = await import('../notifications');
    const result = await createNotificationAction('app_1', {
      tableId: 'table_1',
      name: 'Summary',
      triggerType: 'on_create',
      subjectTemplate: 'Created',
      bodyTemplate: 'A record was created.',
      recipientType: 'all_app_users',
    });

    expect(gabNotificationRepoMock.createNotification).toHaveBeenCalledWith('app_1', {
      tableId: 'table_1',
      name: 'Summary',
      triggerType: 'on_create',
      subjectTemplate: 'Created',
      bodyTemplate: 'A record was created.',
      recipientType: 'all_app_users',
    });
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('notif_1');
  });

  it('createNotificationAction returns the error contract when creation fails', async () => {
    gabNotificationRepoMock.createNotification.mockRejectedValue(new Error('Create failed'));

    const { createNotificationAction } = await import('../notifications');
    const result = await createNotificationAction('app_1', {
      tableId: 'table_1',
      name: 'Summary',
      triggerType: 'on_create',
      subjectTemplate: 'Created',
      bodyTemplate: 'A record was created.',
      recipientType: 'all_app_users',
    });

    expect(result).toEqual({
      success: false,
      error: 'Create failed',
    });
  });

  it('getNotificationAction returns a single notification', async () => {
    gabNotificationRepoMock.getNotification.mockResolvedValue({
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
    });

    const { getNotificationAction } = await import('../notifications');
    const result = await getNotificationAction('app_1', 'notif_1');

    expect(gabNotificationRepoMock.getNotification).toHaveBeenCalledWith('app_1', 'notif_1');
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('notif_1');
  });

  it('getNotificationAction returns the error contract when fetch fails', async () => {
    gabNotificationRepoMock.getNotification.mockRejectedValue(new Error('Get failed'));

    const { getNotificationAction } = await import('../notifications');
    const result = await getNotificationAction('app_1', 'notif_1');

    expect(result).toEqual({
      success: false,
      error: 'Get failed',
    });
  });

  it('listNotificationsByTableAction returns table-scoped notifications', async () => {
    gabNotificationRepoMock.listNotificationsByTable.mockResolvedValue({
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
    });

    const { listNotificationsByTableAction } = await import('../notifications');
    const result = await listNotificationsByTableAction('app_1', 'table_1');

    expect(gabNotificationRepoMock.listNotificationsByTable).toHaveBeenCalledWith('app_1', 'table_1');
    expect(result).toEqual({
      success: true,
      data: {
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
      },
    });
  });

  it('listNotificationsByTableAction returns the error contract when table listing fails', async () => {
    gabNotificationRepoMock.listNotificationsByTable.mockRejectedValue(new Error('Table list failed'));

    const { listNotificationsByTableAction } = await import('../notifications');
    const result = await listNotificationsByTableAction('app_1', 'table_1');

    expect(result).toEqual({
      success: false,
      error: 'Table list failed',
    });
  });
});
