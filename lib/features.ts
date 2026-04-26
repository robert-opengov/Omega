/**
 * Client-safe feature-flag helpers.
 *
 * This file MUST stay free of server-only imports (no `next/headers`,
 * no `next/navigation`, no cookie reads). It is imported by client
 * components — including `providers/module-flags-provider.tsx` and
 * `config/navigation.config.ts` — so any server-only edge would pull
 * `next/headers` into the browser bundle and break the build.
 *
 * Two layers of state exist in the system:
 *
 * 1. **Baseline** — `modulesConfig` from `config/modules.config.ts`,
 *    seeded from `NEXT_PUBLIC_MODULE_*` env vars at build time. Always
 *    available synchronously, on both client and server.
 *
 * 2. **Effective** — baseline merged with the per-browser override cookie
 *    written by the `/settings/modules` UI. Only readable server-side
 *    via `cookies()` in `lib/feature-overrides.ts`.
 *
 * For server-side guards that consult the effective state, import
 * `featureGuard` / `assertModuleEnabled` from `@/lib/feature-guards`.
 * For live override-aware client checks, use the `useModuleEnabled`
 * hook from `@/providers/module-flags-provider`.
 */

import { modulesConfig, type ModulePath } from '@/config/modules.config';

/**
 * Sync baseline check — does NOT consult cookie overrides. Safe in any
 * runtime; used by the client provider as a fallback when the React
 * context is missing (e.g. during early bootstrap or in stories/tests).
 */
export function isModuleEnabled(path: ModulePath | string): boolean {
  const segments = path.split('.');
  let cursor: unknown = modulesConfig;
  for (const segment of segments) {
    if (!cursor || typeof cursor !== 'object') return false;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return cursor === true;
}
