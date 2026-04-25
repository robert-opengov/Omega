export interface GabNotification {
  id: string;
  tableId: string;
  name: string;
  description: string | null;
  triggerType: string;
  channel: string;
  subjectTemplate: string;
  bodyTemplate: string;
  recipientType: string;
  recipientConfig: Record<string, unknown>;
  channelConfig: Record<string, unknown>;
  conditions: Record<string, unknown> | null;
  dateCondition: Record<string, unknown> | null;
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationParams {
  tableId: string;
  name: string;
  triggerType: string;
  subjectTemplate: string;
  bodyTemplate: string;
  recipientType: string;
  description?: string | null;
  channel?: string;
  recipientConfig?: Record<string, unknown>;
  channelConfig?: Record<string, unknown>;
  conditions?: Record<string, unknown> | null;
  dateCondition?: Record<string, unknown> | null;
  active?: boolean;
}

export type UpdateNotificationParams = Partial<CreateNotificationParams>;

export interface NotificationLogEntry {
  id: string;
  notificationId: string;
  tableId: string | null;
  recordId: string | null;
  recipient: string | null;
  channel: string | null;
  status: 'sent' | 'failed' | 'queued' | 'bounced' | string;
  error: string | null;
  attempts: number | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface NotificationLogQuery {
  notificationId?: string;
  status?: string;
  offset?: number;
  limit?: number;
}

export interface NotificationLogStats {
  total: number;
  sent: number;
  failed: number;
  queued: number;
  bounced: number;
  avgDeliveryMs: number;
}

export interface IGabNotificationRepository {
  listNotifications(appId: string): Promise<{ items: Record<string, unknown>[]; total: number }>;
  createNotification(appId: string, params: CreateNotificationParams): Promise<GabNotification>;
  getNotification(appId: string, notificationId: string): Promise<GabNotification>;
  listNotificationsByTable(appId: string, tableId: string): Promise<{ items: GabNotification[] }>;
  updateNotification(
    appId: string,
    notificationId: string,
    patch: UpdateNotificationParams,
  ): Promise<GabNotification>;
  deleteNotification(appId: string, notificationId: string): Promise<{ ok: boolean }>;
  testNotification(
    appId: string,
    notificationId: string,
  ): Promise<{ message: string; jobId?: string }>;
  listLogs(
    appId: string,
    query?: NotificationLogQuery,
  ): Promise<{ items: NotificationLogEntry[]; total: number; offset: number; limit: number }>;
  getLogStats(
    appId: string,
    query?: NotificationLogQuery,
  ): Promise<NotificationLogStats>;
}
