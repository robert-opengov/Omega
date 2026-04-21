import { IAuthPort } from '../../ports/auth.port';
import {
  CreateNotificationParams,
  GabNotification,
  IGabNotificationRepository,
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
}
