import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('V1-only adapter fallbacks for newly added repos', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects user updates in v1 mode', async () => {
    const { GabUserV1Adapter } = await import('../user.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };
    const adapter = new GabUserV1Adapter(authPort as any, 'https://gab-v1.example.com');

    await expect(adapter.updateUser('user_1', { firstName: 'Ada' })).rejects.toThrow(
      'Not supported when GAB_API_VERSION=v1',
    );
  });

  it('rejects user list/get in v1 mode', async () => {
    const { GabUserV1Adapter } = await import('../user.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };
    const adapter = new GabUserV1Adapter(authPort as any, 'https://gab-v1.example.com');

    await expect(adapter.listUsers()).rejects.toThrow(
      'Not supported when GAB_API_VERSION=v1',
    );
    await expect(adapter.getUser('user_1')).rejects.toThrow(
      'Not supported when GAB_API_VERSION=v1',
    );
  });

  it('rejects notifications in v1 mode', async () => {
    const { GabNotificationsV1Adapter } = await import('../notifications.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };
    const adapter = new GabNotificationsV1Adapter(authPort as any, 'https://gab-v1.example.com');

    await expect(adapter.listNotifications('app_1')).rejects.toThrow(
      'Not supported when GAB_API_VERSION=v1',
    );
    await expect(
      adapter.createNotification('app_1', {
        tableId: 'table_1',
        name: 'Summary',
        triggerType: 'on_create',
        subjectTemplate: 'Created',
        bodyTemplate: 'Created',
        recipientType: 'all_app_users',
      }),
    ).rejects.toThrow('Not supported when GAB_API_VERSION=v1');
    await expect(adapter.getNotification('app_1', 'notif_1')).rejects.toThrow(
      'Not supported when GAB_API_VERSION=v1',
    );
    await expect(adapter.listNotificationsByTable('app_1', 'table_1')).rejects.toThrow(
      'Not supported when GAB_API_VERSION=v1',
    );
  });

  it('rejects app-role requests in v1 mode', async () => {
    const { GabAppRoleV1Adapter } = await import('../app-role.adapter');
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };
    const adapter = new GabAppRoleV1Adapter(authPort as any, 'https://gab-v1.example.com');

    await expect(adapter.listRoles('app_1')).rejects.toThrow(
      'Not supported when GAB_API_VERSION=v1',
    );
    await expect(adapter.createRole('app_1', { name: 'Reviewer' })).rejects.toThrow(
      'Not supported when GAB_API_VERSION=v1',
    );
    await expect(adapter.getRole('app_1', 'role_1')).rejects.toThrow(
      'Not supported when GAB_API_VERSION=v1',
    );
  });
});
