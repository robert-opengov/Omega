'use server';

import { revalidatePath } from 'next/cache';
import { gabCustomComponentRepo } from '@/lib/core';
import type {
  CreateCustomComponentPayload,
  GabCustomComponent,
  UpdateCustomComponentPayload,
} from '@/lib/core/ports/custom-components.repository';

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function fail<T>(scope: string, err: unknown): ActionResult<T> {
  const message = err instanceof Error ? err.message : `Failed to ${scope}.`;
  console.error(`${scope} error:`, message);
  return { success: false, error: message };
}

function revalidateComponents(appId: string, key?: string) {
  revalidatePath(`/apps/${appId}/components`);
  if (key) revalidatePath(`/apps/${appId}/components/${key}/edit`);
}

export async function listCustomComponentsAction(
  appId: string,
): Promise<ActionResult<{ items: GabCustomComponent[]; total: number }>> {
  try {
    return { success: true, data: await gabCustomComponentRepo.listComponents(appId) };
  } catch (err) {
    return fail('listCustomComponentsAction', err);
  }
}

export async function getCustomComponentAction(
  appId: string,
  key: string,
): Promise<ActionResult<GabCustomComponent>> {
  try {
    return { success: true, data: await gabCustomComponentRepo.getComponent(appId, key) };
  } catch (err) {
    return fail('getCustomComponentAction', err);
  }
}

export async function createCustomComponentAction(
  appId: string,
  payload: CreateCustomComponentPayload,
): Promise<ActionResult<GabCustomComponent>> {
  try {
    const data = await gabCustomComponentRepo.createComponent(appId, payload);
    revalidateComponents(appId, data.key);
    return { success: true, data };
  } catch (err) {
    return fail('createCustomComponentAction', err);
  }
}

export async function updateCustomComponentAction(
  appId: string,
  key: string,
  patch: UpdateCustomComponentPayload,
): Promise<ActionResult<GabCustomComponent>> {
  try {
    const data = await gabCustomComponentRepo.updateComponent(appId, key, patch);
    revalidateComponents(appId, key);
    return { success: true, data };
  } catch (err) {
    return fail('updateCustomComponentAction', err);
  }
}

export async function deleteCustomComponentAction(
  appId: string,
  key: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabCustomComponentRepo.deleteComponent(appId, key);
    revalidatePath(`/apps/${appId}/components`);
    return { success: true, data };
  } catch (err) {
    return fail('deleteCustomComponentAction', err);
  }
}

export async function getCustomComponentUsageAction(
  appId: string,
  key: string,
) {
  try {
    return { success: true, data: await gabCustomComponentRepo.getUsage(appId, key) };
  } catch (err) {
    return fail('getCustomComponentUsageAction', err);
  }
}

export async function rollbackCustomComponentAction(
  appId: string,
  key: string,
  version: number,
): Promise<ActionResult<GabCustomComponent>> {
  try {
    const data = await gabCustomComponentRepo.rollbackComponent(appId, key, version);
    revalidateComponents(appId, key);
    return { success: true, data };
  } catch (err) {
    return fail('rollbackCustomComponentAction', err);
  }
}
