/**
 * Per-request app context — cached metadata used by every page nested
 * under `app/(dashboard)/apps/[appId]/...`.
 *
 * Wrapped in React `cache()` so multiple Server Components in the same
 * request tree (layout + page + parallel routes) share a single fetch.
 */

import { cache } from 'react';
import { gabAppRepo } from '@/lib/core';
import type { GabApp } from '@/lib/core/ports/app.repository';

export interface AppContext {
  app: GabApp;
  /** True when the app is a sandbox of another app. */
  isSandbox: boolean;
  /** True when schema edits are blocked (sandbox-only mode). */
  schemaLocked: boolean;
}

/**
 * Resolve the current app and derived flags. Throws if the app is missing
 * or the user is not authorized to read it; the caller should let Next.js
 * surface this as a 404 / 403 boundary.
 */
export const getAppContext = cache(async (appId: string): Promise<AppContext> => {
  const app = await gabAppRepo.getApp(appId);
  return {
    app,
    isSandbox: Boolean(app.sandboxOf),
    schemaLocked: Boolean(app.schemaLockedAt),
  };
});

/**
 * Best-effort version that returns `null` when the app cannot be loaded.
 * Useful for layouts that should still render a shell on permission errors.
 */
export const tryGetAppContext = cache(async (appId: string): Promise<AppContext | null> => {
  try {
    return await getAppContext(appId);
  } catch (err) {
    console.warn(`tryGetAppContext(${appId}) failed:`, err instanceof Error ? err.message : err);
    return null;
  }
});
