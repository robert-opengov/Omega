/**
 * Cache tag helpers shared between the runtime page loader and the
 * `pages.ts` server actions. Keeping them in one module makes it impossible
 * for the writer and reader to drift apart.
 *
 * Tags:
 *   - `app-pages:<appId>`        — flushed on any list-affecting mutation
 *                                  (create / delete / duplicate / list refresh)
 *   - `app-page:<appId>:<slug>`  — flushed when a single page changes
 *                                  (update / delete / duplicate / slug rename)
 */

export function appPagesCacheTag(appId: string): string {
  return `app-pages:${appId}`;
}

export function pageCacheTag(appId: string, slug: string): string {
  return `app-page:${appId}:${slug}`;
}
