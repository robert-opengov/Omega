'use server';

import { revalidatePath } from 'next/cache';
import { gabNotificationRepo } from '@/lib/core';
import type {
  CreateNotificationParams,
  GabNotification,
  NotificationLogEntry,
  NotificationLogQuery,
  NotificationLogStats,
  UpdateNotificationParams,
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

export async function updateNotificationAction(
  appId: string,
  notificationId: string,
  patch: UpdateNotificationParams,
): Promise<{ success: boolean; data?: GabNotification; error?: string }> {
  try {
    const result = await gabNotificationRepo.updateNotification(appId, notificationId, patch);
    revalidatePath(`/apps/${appId}/notifications`);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update notification.';
    console.error('updateNotificationAction error:', message);
    return { success: false, error: message };
  }
}

export async function deleteNotificationAction(
  appId: string,
  notificationId: string,
): Promise<{ success: boolean; data?: { ok: boolean }; error?: string }> {
  try {
    const result = await gabNotificationRepo.deleteNotification(appId, notificationId);
    revalidatePath(`/apps/${appId}/notifications`);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete notification.';
    console.error('deleteNotificationAction error:', message);
    return { success: false, error: message };
  }
}

export async function testNotificationAction(
  appId: string,
  notificationId: string,
): Promise<{ success: boolean; data?: { message: string; jobId?: string }; error?: string }> {
  try {
    const result = await gabNotificationRepo.testNotification(appId, notificationId);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send test notification.';
    console.error('testNotificationAction error:', message);
    return { success: false, error: message };
  }
}

export async function listNotificationLogsAction(
  appId: string,
  query?: NotificationLogQuery,
): Promise<{
  success: boolean;
  data?: { items: NotificationLogEntry[]; total: number; offset: number; limit: number };
  error?: string;
}> {
  try {
    const result = await gabNotificationRepo.listLogs(appId, query);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list notification logs.';
    console.error('listNotificationLogsAction error:', message);
    return { success: false, error: message };
  }
}

export async function getNotificationLogStatsAction(
  appId: string,
  query?: NotificationLogQuery,
): Promise<{ success: boolean; data?: NotificationLogStats; error?: string }> {
  try {
    const result = await gabNotificationRepo.getLogStats(appId, query);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch log stats.';
    console.error('getNotificationLogStatsAction error:', message);
    return { success: false, error: message };
  }
}
