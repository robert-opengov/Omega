import { IAuthPort } from '../../ports/auth.port';
import {
  CreateNotificationParams,
  GabNotification,
  IGabNotificationRepository,
} from '../../ports/notification.repository';

function normalizeNotification(notification: any): GabNotification {
  return {
    id: String(notification.id ?? ''),
    tableId: String(notification.tableId ?? ''),
    name: notification.name || '',
    description: notification.description ?? null,
    triggerType: notification.triggerType || '',
    channel: notification.channel || '',
    subjectTemplate: notification.subjectTemplate || '',
    bodyTemplate: notification.bodyTemplate || '',
    recipientType: notification.recipientType || '',
    recipientConfig: notification.recipientConfig ?? {},
    channelConfig: notification.channelConfig ?? {},
    conditions: notification.conditions ?? null,
    dateCondition: notification.dateCondition ?? null,
    active: Boolean(notification.active),
    createdBy: notification.createdBy || '',
    createdAt: notification.createdAt || '',
    updatedAt: notification.updatedAt || '',
  };
}

export class GabNotificationsV2Adapter implements IGabNotificationRepository {
  constructor(private authPort: IAuthPort, private apiUrl: string) {}

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = await this.authPort.getToken();
    const headers = new Headers(options.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');

    const res = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || err?.error || `GAB Notification API Error: ${res.statusText}`);
    }

    return res.json();
  }

  async listNotifications(appId: string): Promise<{ items: Record<string, unknown>[]; total: number }> {
    const response = await this.fetchWithAuth(`/v2/apps/${appId}/notifications`, {
      method: 'GET',
    });

    return {
      items: Array.isArray(response.items) ? response.items : [],
      total: Number(response.total ?? 0),
    };
  }

  async createNotification(appId: string, params: CreateNotificationParams): Promise<GabNotification> {
    const response = await this.fetchWithAuth(`/v2/apps/${appId}/notifications`, {
      method: 'POST',
      body: JSON.stringify(params),
    });

    return normalizeNotification(response);
  }

  async getNotification(appId: string, notificationId: string): Promise<GabNotification> {
    const response = await this.fetchWithAuth(`/v2/apps/${appId}/notifications/${notificationId}`, {
      method: 'GET',
    });

    return normalizeNotification(response);
  }

  async listNotificationsByTable(appId: string, tableId: string): Promise<{ items: GabNotification[] }> {
    const response = await this.fetchWithAuth(`/v2/apps/${appId}/tables/${tableId}/notifications`, {
      method: 'GET',
    });

    return {
      items: Array.isArray(response.items) ? response.items.map(normalizeNotification) : [],
    };
  }
}
