'use server';

/**
 * Server Actions for app (application) lifecycle and insight surfaces.
 * Backed by `gabAppRepo` from the composition root.
 */

import { revalidatePath } from 'next/cache';
import { gabAppRepo } from '@/lib/core';
import type {
  GabApp,
  AppNavigation,
  CreateAppPayload,
  UpdateAppPayload,
  CopyAppPayload,
  ComplexityScore,
  DependencyGraph,
} from '@/lib/core/ports/app.repository';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function fail<T>(label: string, err: unknown): ActionResult<T> {
  const message = err instanceof Error ? err.message : `Failed: ${label}`;
  console.error(`${label} error:`, message);
  return { success: false, error: message };
}

export async function listAppsAction(
  companyId?: string,
): Promise<ActionResult<{ items: GabApp[]; total: number }>> {
  try {
    return { success: true, data: await gabAppRepo.listApps(companyId) };
  } catch (err) {
    return fail('listAppsAction', err);
  }
}

export async function getAppAction(appId: string): Promise<ActionResult<GabApp>> {
  try {
    return { success: true, data: await gabAppRepo.getApp(appId) };
  } catch (err) {
    return fail('getAppAction', err);
  }
}

export async function createAppAction(
  payload: CreateAppPayload,
): Promise<ActionResult<GabApp>> {
  try {
    const data = await gabAppRepo.createApp(payload);
    revalidatePath('/apps');
    return { success: true, data };
  } catch (err) {
    return fail('createAppAction', err);
  }
}

export async function updateAppAction(
  appId: string,
  payload: UpdateAppPayload,
): Promise<ActionResult<GabApp>> {
  try {
    const data = await gabAppRepo.updateApp(appId, payload);
    revalidatePath(`/apps/${appId}`);
    revalidatePath('/apps');
    return { success: true, data };
  } catch (err) {
    return fail('updateAppAction', err);
  }
}

export async function deleteAppAction(
  appId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabAppRepo.deleteApp(appId);
    revalidatePath('/apps');
    return { success: true, data };
  } catch (err) {
    return fail('deleteAppAction', err);
  }
}

export async function copyAppAction(
  appId: string,
  payload: CopyAppPayload,
): Promise<ActionResult<GabApp>> {
  try {
    const data = await gabAppRepo.copyApp(appId, payload);
    revalidatePath('/apps');
    return { success: true, data };
  } catch (err) {
    return fail('copyAppAction', err);
  }
}

export async function getComplexityScoreAction(
  appId: string,
): Promise<ActionResult<ComplexityScore>> {
  try {
    return { success: true, data: await gabAppRepo.getComplexityScore(appId) };
  } catch (err) {
    return fail('getComplexityScoreAction', err);
  }
}

export async function getDependencyGraphAction(
  appId: string,
): Promise<ActionResult<DependencyGraph>> {
  try {
    return { success: true, data: await gabAppRepo.getDependencyGraph(appId) };
  } catch (err) {
    return fail('getDependencyGraphAction', err);
  }
}

export async function updateAppNavigationAction(
  appId: string,
  navigation: AppNavigation | null,
): Promise<ActionResult<GabApp>> {
  try {
    const data = await gabAppRepo.updateApp(appId, { navigation });
    revalidatePath(`/apps/${appId}`);
    revalidatePath(`/apps/${appId}/settings/navigation`);
    return { success: true, data };
  } catch (err) {
    return fail('updateAppNavigationAction', err);
  }
}
