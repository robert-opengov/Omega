/**
 * Server-only feature-flag guards.
 *
 * Kept in a separate module from `lib/features.ts` so the client bundle
 * never traces a path to `next/headers`. Anything importing this file
 * MUST be a Server Component, Server Action, route handler, or other
 * server-only module.
 *
 * - `featureGuard(path)`        → calls `notFound()` when disabled.
 *                                 Use at the top of `page.tsx`/`layout.tsx`.
 * - `assertModuleEnabled(path)` → throws `FeatureDisabledError` instead.
 *                                 Use inside Server Actions to bail with
 *                                 a structured error.
 *
 * Both consult the *effective* module config (env baseline merged with
 * the per-browser override cookie). Use `isModuleEnabled` from
 * `lib/features.ts` for sync, baseline-only checks on the client.
 */

import 'server-only';
import { notFound } from 'next/navigation';
import type { ModulePath } from '@/config/modules.config';
import { isModuleEnabledNow } from '@/lib/feature-overrides';

export class FeatureDisabledError extends Error {
  constructor(path: string) {
    super(`Feature disabled: ${path}`);
    this.name = 'FeatureDisabledError';
  }
}

/**
 * Server-side route guard. Call (with `await`) at the top of any Server
 * Component `page.tsx` whose entire feature should disappear when the
 * module is off. Reads cookie overrides so toggles in the admin UI take
 * effect on next render without a redeploy.
 */
export async function featureGuard(path: ModulePath): Promise<void> {
  const enabled = await isModuleEnabledNow(path);
  if (!enabled) {
    notFound();
  }
}

/**
 * Server-action-friendly variant — throws a typed error instead of
 * triggering Next's not-found boundary.
 */
export async function assertModuleEnabled(path: ModulePath): Promise<void> {
  const enabled = await isModuleEnabledNow(path);
  if (!enabled) {
    throw new FeatureDisabledError(path);
  }
}
