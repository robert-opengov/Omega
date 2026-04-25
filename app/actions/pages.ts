'use server';

import { revalidatePath } from 'next/cache';
import { gabPageRepo } from '@/lib/core';
import type {
  CreatePagePayload,
  GabPage,
  UpdatePagePayload,
} from '@/lib/core/ports/pages.repository';

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

function revalidatePagePaths(appId: string, pageKey?: string) {
  revalidatePath(`/apps/${appId}/pages`);
  if (pageKey) {
    revalidatePath(`/apps/${appId}/pages/${pageKey}/edit`);
    revalidatePath(`/apps/${appId}/p/${pageKey}`);
  }
}

export async function listPagesAction(
  appId: string,
): Promise<ActionResult<{ items: GabPage[]; total: number }>> {
  try {
    const data = await gabPageRepo.listPages(appId);
    return { success: true, data };
  } catch (err) {
    return fail('listPagesAction', err);
  }
}

export async function getPageAction(
  appId: string,
  pageKey: string,
): Promise<ActionResult<GabPage>> {
  try {
    return { success: true, data: await gabPageRepo.getPage(appId, pageKey) };
  } catch (err) {
    return fail('getPageAction', err);
  }
}

export async function createPageAction(
  appId: string,
  payload: CreatePagePayload,
): Promise<ActionResult<GabPage>> {
  try {
    const data = await gabPageRepo.createPage(appId, payload);
    revalidatePagePaths(appId, data.key);
    return { success: true, data };
  } catch (err) {
    return fail('createPageAction', err);
  }
}

export async function updatePageAction(
  appId: string,
  pageKey: string,
  patch: UpdatePagePayload,
): Promise<ActionResult<GabPage>> {
  try {
    const data = await gabPageRepo.updatePage(appId, pageKey, patch);
    revalidatePagePaths(appId, pageKey);
    return { success: true, data };
  } catch (err) {
    return fail('updatePageAction', err);
  }
}

export async function deletePageAction(
  appId: string,
  pageKey: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabPageRepo.deletePage(appId, pageKey);
    revalidatePath(`/apps/${appId}/pages`);
    return { success: true, data };
  } catch (err) {
    return fail('deletePageAction', err);
  }
}

export async function duplicatePageAction(
  appId: string,
  pageKey: string,
): Promise<ActionResult<GabPage>> {
  try {
    const data = await gabPageRepo.duplicatePage(appId, pageKey);
    revalidatePagePaths(appId, data.key);
    return { success: true, data };
  } catch (err) {
    return fail('duplicatePageAction', err);
  }
}
