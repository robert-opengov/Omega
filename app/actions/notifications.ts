'use server';

import { gabNotificationRepo } from '@/lib/core';
import type {
  CreateNotificationParams,
  GabNotification,
} from '@/lib/core/ports/notification.repository';

export async function listNotificationsAction(
  appId: string,
): Promise<{ success: boolean; data?: { items: Record<string, unknown>[]; total: number }; error?: string }> {
  try {
    const result = await gabNotificationRepo.listNotifications(appId);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list notifications.';
    console.error('listNotificationsAction error:', message);
    return { success: false, error: message };
  }
}

export async function createNotificationAction(
  appId: string,
  params: CreateNotificationParams,
): Promise<{ success: boolean; data?: GabNotification; error?: string }> {
  try {
    const result = await gabNotificationRepo.createNotification(appId, params);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create notification.';
    console.error('createNotificationAction error:', message);
    return { success: false, error: message };
  }
}

export async function getNotificationAction(
  appId: string,
  notificationId: string,
): Promise<{ success: boolean; data?: GabNotification; error?: string }> {
  try {
    const result = await gabNotificationRepo.getNotification(appId, notificationId);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get notification.';
    console.error('getNotificationAction error:', message);
    return { success: false, error: message };
  }
}

export async function listNotificationsByTableAction(
  appId: string,
  tableId: string,
): Promise<{ success: boolean; data?: { items: GabNotification[] }; error?: string }> {
  try {
    const result = await gabNotificationRepo.listNotificationsByTable(appId, tableId);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list table notifications.';
    console.error('listNotificationsByTableAction error:', message);
    return { success: false, error: message };
  }
}
