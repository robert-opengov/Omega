import { IAuthPort } from '../../ports/auth.port';
import {
  CreateNotificationParams,
  GabNotification,
  IGabNotificationRepository,
  NotificationLogEntry,
  NotificationLogQuery,
  NotificationLogStats,
  UpdateNotificationParams,
} from '../../ports/notification.repository';

/**
 * Intentional rollout policy: notification resource support is being added
 * only for v2 flows in this phase, even though legacy v1 equivalents existed.
 */
export class GabNotificationsV1Adapter implements IGabNotificationRepository {
  constructor(
    private _authPort: IAuthPort,
    private _apiUrl: string,
  ) {}

  async listNotifications(_appId: string): Promise<{ items: Record<string, unknown>[]; total: number }> {
    throw new Error('Not supported when GAB_API_VERSION=v1');
  }

  async createNotification(_appId: string, _params: CreateNotificationParams): Promise<GabNotification> {
    throw new Error('Not supported when GAB_API_VERSION=v1');
  }

  async getNotification(_appId: string, _notificationId: string): Promise<GabNotification> {
    throw new Error('Not supported when GAB_API_VERSION=v1');
  }

  async listNotificationsByTable(_appId: string, _tableId: string): Promise<{ items: GabNotification[] }> {
    throw new Error('Not supported when GAB_API_VERSION=v1');
  }

  async updateNotification(
    _appId: string,
    _notificationId: string,
    _patch: UpdateNotificationParams,
  ): Promise<GabNotification> {
    throw new Error('Not supported when GAB_API_VERSION=v1');
  }

  async deleteNotification(_appId: string, _notificationId: string): Promise<{ ok: boolean }> {
    throw new Error('Not supported when GAB_API_VERSION=v1');
  }

  async testNotification(
    _appId: string,
    _notificationId: string,
  ): Promise<{ message: string; jobId?: string }> {
    throw new Error('Not supported when GAB_API_VERSION=v1');
  }

  async listLogs(
    _appId: string,
    _query?: NotificationLogQuery,
  ): Promise<{ items: NotificationLogEntry[]; total: number; offset: number; limit: number }> {
    throw new Error('Not supported when GAB_API_VERSION=v1');
  }

  async getLogStats(
    _appId: string,
    _query?: NotificationLogQuery,
  ): Promise<NotificationLogStats> {
    throw new Error('Not supported when GAB_API_VERSION=v1');
  }
}
