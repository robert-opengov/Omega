'use server';

/**
 * Server Actions backing the `/settings/modules` admin UI.
 *
 * Each mutation:
 *   1. Validates the requested `ModulePath` against the live catalog.
 *   2. Updates the override cookie via `lib/feature-overrides`.
 *   3. Calls `revalidatePath('/', 'layout')` so the root layout re-runs
 *      `getEffectiveModules()` and the fresh value flows down through
 *      the `ModuleFlagsProvider` to every consumer.
 *
 * Failures return a structured `{ ok: false, error }` shape rather than
 * throwing — the UI surfaces the error in a toast.
 */

import { revalidatePath } from 'next/cache';
import {
  clearAllOverrides,
  clearOverride,
  getEffectiveModules,
  isValidModulePath,
  readOverrides,
  setOverride,
  type ModuleOverrides,
} from '@/lib/feature-overrides';
import {
  modulesConfig,
  type ModulePath,
  type ModulesConfig,
} from '@/config/modules.config';

export interface ModuleFlagSnapshot {
  baseline: ModulesConfig;
  effective: ModulesConfig;
  overrides: ModuleOverrides;
}

export type FlagActionResult =
  | { ok: true; snapshot: ModuleFlagSnapshot }
  | { ok: false; error: string };

/**
 * Read-only snapshot used by the settings page to seed initial state.
 * Server Components can call this directly; the client UI re-fetches
 * after each mutation via the action's return value.
 */
export async function getModuleFlagSnapshot(): Promise<ModuleFlagSnapshot> {
  const [overrides, effective] = await Promise.all([
    readOverrides(),
    getEffectiveModules(),
  ]);
  return { baseline: modulesConfig, effective, overrides };
}

export async function setModuleOverrideAction(
  path: string,
  value: boolean,
): Promise<FlagActionResult> {
  if (!isValidModulePath(path)) {
    return { ok: false, error: `Unknown module path: ${path}` };
  }
  await setOverride(path as ModulePath, value);
  revalidatePath('/', 'layout');
  const snapshot = await getModuleFlagSnapshot();
  return { ok: true, snapshot };
}

export async function clearModuleOverrideAction(
  path: string,
): Promise<FlagActionResult> {
  if (!isValidModulePath(path)) {
    return { ok: false, error: `Unknown module path: ${path}` };
  }
  await clearOverride(path as ModulePath);
  revalidatePath('/', 'layout');
  const snapshot = await getModuleFlagSnapshot();
  return { ok: true, snapshot };
}

export async function clearAllModuleOverridesAction(): Promise<FlagActionResult> {
  await clearAllOverrides();
  revalidatePath('/', 'layout');
  const snapshot = await getModuleFlagSnapshot();
  return { ok: true, snapshot };
}
