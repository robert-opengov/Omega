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

export interface IGabNotificationRepository {
  listNotifications(appId: string): Promise<{ items: Record<string, unknown>[]; total: number }>;
  createNotification(appId: string, params: CreateNotificationParams): Promise<GabNotification>;
  getNotification(appId: string, notificationId: string): Promise<GabNotification>;
  listNotificationsByTable(appId: string, tableId: string): Promise<{ items: GabNotification[] }>;
}
