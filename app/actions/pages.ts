'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { gabPageRepo } from '@/lib/core';
import { pageCacheTag, appPagesCacheTag } from '@/lib/page-builder/page-cache-tags';
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

/**
 * Invalidate every cache layer touched by a page mutation:
 *   - admin list + edit routes (`/apps/:appId/pages*`)
 *   - public/runtime routes by slug (`/apps/:appId/p/:slug`, `/view/:appId/:slug`)
 *   - the unstable_cache layer used by `getPageBySlugCached` (via tags)
 */
function revalidatePagePaths(appId: string, page?: { key?: string; slug?: string }) {
  revalidatePath(`/apps/${appId}/pages`);
  // `updateTag` (vs `revalidateTag`) flushes the unstable_cache entry
  // synchronously inside the server action so the next read in the same
  // request tree sees the freshly persisted page.
  updateTag(appPagesCacheTag(appId));
  if (page?.key) {
    revalidatePath(`/apps/${appId}/pages/${page.key}/edit`);
  }
  if (page?.slug) {
    revalidatePath(`/apps/${appId}/p/${page.slug}`);
    revalidatePath(`/view/${appId}/${page.slug}`);
    updateTag(pageCacheTag(appId, page.slug));
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
    revalidatePagePaths(appId, { key: data.key, slug: data.slug });
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
    // Snapshot the prior slug before applying the patch so a slug change
    // invalidates both the old and new runtime URLs.
    let previousSlug: string | undefined;
    if (patch.slug) {
      try {
        const prior = await gabPageRepo.getPage(appId, pageKey);
        previousSlug = prior.slug;
      } catch {
        /* If the lookup fails we still proceed with the update. */
      }
    }
    const data = await gabPageRepo.updatePage(appId, pageKey, patch);
    revalidatePagePaths(appId, { key: pageKey, slug: data.slug });
    if (previousSlug && previousSlug !== data.slug) {
      revalidatePagePaths(appId, { slug: previousSlug });
    }
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
    // Capture the slug so we can flush the runtime route's cache too.
    let slug: string | undefined;
    try {
      const prior = await gabPageRepo.getPage(appId, pageKey);
      slug = prior.slug;
    } catch {
      /* If lookup fails we still proceed with the delete + bump the list. */
    }
    const data = await gabPageRepo.deletePage(appId, pageKey);
    revalidatePagePaths(appId, { key: pageKey, slug });
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
    revalidatePagePaths(appId, { key: data.key, slug: data.slug });
    return { success: true, data };
  } catch (err) {
    return fail('duplicatePageAction', err);
  }
}
