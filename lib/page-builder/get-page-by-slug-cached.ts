import 'server-only';
import { unstable_cache } from 'next/cache';
import { gabPageRepo } from '@/lib/core';
import type { GabPage } from '@/lib/core/ports/pages.repository';
import { appPagesCacheTag, pageCacheTag } from './page-cache-tags';

/**
 * Cached server-side lookup for the public/runtime page route.
 *
 * `unstable_cache` memoizes the resolved page in the Next.js data cache and
 * tags it so a `revalidateTag(...)` from `app/actions/pages.ts` flushes it
 * the moment the page is updated, deleted, or its slug renamed.
 *
 * The cache key is `[appId, slug]`. We cap revalidation at 1 hour so even
 * without an explicit invalidation the runtime never serves a stale layout
 * for too long.
 */
export async function getPageBySlugCached(
  appId: string,
  slug: string,
): Promise<GabPage | null> {
  const fetcher = unstable_cache(
    async (a: string, s: string) => gabPageRepo.getPageBySlug(a, s),
    ['gab-page-by-slug', appId, slug],
    {
      revalidate: 3600,
      tags: [appPagesCacheTag(appId), pageCacheTag(appId, slug)],
    },
  );
  return fetcher(appId, slug);
}
