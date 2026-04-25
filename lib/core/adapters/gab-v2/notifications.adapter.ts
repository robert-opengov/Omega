import { IAuthPort } from '../../ports/auth.port';
import {
  CreateNotificationParams,
  GabNotification,
  IGabNotificationRepository,
  UpdateNotificationParams,
  NotificationLogEntry,
  NotificationLogQuery,
  NotificationLogStats,
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

  async updateNotification(
    appId: string,
    notificationId: string,
    patch: UpdateNotificationParams,
  ): Promise<GabNotification> {
    const response = await this.fetchWithAuth(
      `/v2/apps/${appId}/notifications/${notificationId}`,
      { method: 'PATCH', body: JSON.stringify(patch) },
    );
    return normalizeNotification(response);
  }

  async deleteNotification(appId: string, notificationId: string): Promise<{ ok: boolean }> {
    const token = await this.authPort.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${this.apiUrl}/v2/apps/${appId}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || err?.error || `GAB Notification API Error: ${res.statusText}`);
    }
    return { ok: true };
  }

  async testNotification(
    appId: string,
    notificationId: string,
  ): Promise<{ message: string; jobId?: string }> {
    const response = await this.fetchWithAuth(
      `/v2/apps/${appId}/notifications/${notificationId}/test`,
      { method: 'POST' },
    );
    return {
      message: String(response?.message ?? ''),
      ...(response?.jobId ? { jobId: String(response.jobId) } : {}),
    };
  }

  async listLogs(
    appId: string,
    query: NotificationLogQuery = {},
  ): Promise<{ items: NotificationLogEntry[]; total: number; offset: number; limit: number }> {
    const sp = new URLSearchParams();
    if (query.notificationId) sp.append('notificationId', query.notificationId);
    if (query.status) sp.append('status', query.status);
    if (query.offset != null) sp.append('offset', String(query.offset));
    if (query.limit != null) sp.append('limit', String(query.limit));
    const qs = sp.toString();
    const response = await this.fetchWithAuth(
      `/v2/apps/${appId}/notifications/logs${qs ? `?${qs}` : ''}`,
      { method: 'GET' },
    );
    const items = Array.isArray(response?.items) ? response.items : [];
    return {
      items: items.map((raw: any): NotificationLogEntry => ({
        id: String(raw.id ?? ''),
        notificationId: String(raw.notificationId ?? ''),
        tableId: raw.tableId ?? null,
        recordId: raw.recordId ?? null,
        recipient: raw.recipient ?? null,
        channel: raw.channel ?? null,
        status: String(raw.status ?? 'queued'),
        error: raw.error ?? null,
        attempts: raw.attempts ?? null,
        deliveredAt: raw.deliveredAt ?? null,
        createdAt: String(raw.createdAt ?? ''),
      })),
      total: Number(response?.total ?? items.length),
      offset: Number(response?.offset ?? 0),
      limit: Number(response?.limit ?? items.length),
    };
  }

  async getLogStats(
    appId: string,
    query: NotificationLogQuery = {},
  ): Promise<NotificationLogStats> {
    const sp = new URLSearchParams();
    if (query.notificationId) sp.append('notificationId', query.notificationId);
    if (query.status) sp.append('status', query.status);
    const qs = sp.toString();
    const response = await this.fetchWithAuth(
      `/v2/apps/${appId}/notifications/logs/stats${qs ? `?${qs}` : ''}`,
      { method: 'GET' },
    );
    return {
      total: Number(response?.total ?? 0),
      sent: Number(response?.sent ?? 0),
      failed: Number(response?.failed ?? 0),
      queued: Number(response?.queued ?? 0),
      bounced: Number(response?.bounced ?? 0),
      avgDeliveryMs: Number(response?.avgDeliveryMs ?? 0),
    };
  }
}
