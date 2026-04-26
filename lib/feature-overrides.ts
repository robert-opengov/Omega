/**
 * Per-browser overrides for module flags.
 *
 * Source of truth precedence (highest wins):
 *   1. Override cookie (set via `/settings/modules` UI)
 *   2. NEXT_PUBLIC_MODULE_* env var (baseline at build time)
 *   3. Default in `modulesConfig` (currently `true` for every module)
 *
 * The override cookie holds a JSON object of `Partial<Record<ModulePath, boolean>>`.
 * Empty object / missing cookie → no overrides → baseline applies.
 *
 * SCOPE / SECURITY NOTES:
 * - Per-browser, not per-tenant. Persisting overrides server-side per
 *   tenant is a future enhancement.
 * - Cookie is `httpOnly: false` so the client provider can read it on
 *   first paint, but writes go through a server action so we can revalidate
 *   layouts after the change. This keeps the API tiny and avoids drift.
 * - Validated against the `ModulePath` union before writing — unknown
 *   paths are silently dropped to keep the cookie compact.
 */
import 'server-only';
import { cookies } from 'next/headers';
import {
  modulesConfig,
  type ModulePath,
  type ModulesConfig,
} from '@/config/modules.config';

export const OVERRIDES_COOKIE = 'omega_module_overrides';

/** 1 year — overrides survive sessions until cleared in the UI. */
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export type ModuleOverrides = Partial<Record<ModulePath, boolean>>;

/**
 * Whitelist of every valid `ModulePath` — derived from the live
 * `modulesConfig` so adding a flag to the config automatically extends
 * the validator.
 */
function buildValidPaths(): Set<string> {
  const paths = new Set<string>();
  for (const category of Object.keys(modulesConfig) as Array<keyof ModulesConfig>) {
    for (const leaf of Object.keys(modulesConfig[category])) {
      paths.add(`${category}.${leaf}`);
    }
  }
  return paths;
}
const VALID_PATHS = buildValidPaths();

export function isValidModulePath(path: string): path is ModulePath {
  return VALID_PATHS.has(path);
}

/** Parse the raw cookie value. Always returns a fresh, validated object. */
export function parseOverrides(raw: string | undefined | null): ModuleOverrides {
  if (!raw) return {};
  try {
    const decoded = decodeURIComponent(raw);
    const obj = JSON.parse(decoded) as unknown;
    if (!obj || typeof obj !== 'object') return {};
    const out: ModuleOverrides = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof value !== 'boolean') continue;
      if (!isValidModulePath(key)) continue;
      out[key as ModulePath] = value;
    }
    return out;
  } catch {
    return {};
  }
}

export function serializeOverrides(overrides: ModuleOverrides): string {
  return encodeURIComponent(JSON.stringify(overrides));
}

/** Read overrides from the request's cookie jar (Server Components / actions). */
export async function readOverrides(): Promise<ModuleOverrides> {
  const store = await cookies();
  return parseOverrides(store.get(OVERRIDES_COOKIE)?.value);
}

/** Persist overrides; mutating server actions handle revalidation themselves. */
export async function writeOverrides(overrides: ModuleOverrides): Promise<void> {
  const store = await cookies();
  if (Object.keys(overrides).length === 0) {
    store.delete(OVERRIDES_COOKIE);
    return;
  }
  store.set(OVERRIDES_COOKIE, serializeOverrides(overrides), {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: ONE_YEAR_SECONDS,
  });
}

export async function setOverride(path: ModulePath, value: boolean): Promise<void> {
  const current = await readOverrides();
  current[path] = value;
  await writeOverrides(current);
}

export async function clearOverride(path: ModulePath): Promise<void> {
  const current = await readOverrides();
  delete current[path];
  await writeOverrides(current);
}

export async function clearAllOverrides(): Promise<void> {
  await writeOverrides({});
}

/**
 * Resolve the effective `ModulesConfig` for the current request — env
 * baseline merged with any cookie overrides. This is what server-side
 * guards consult and what the client provider hydrates from on every
 * page render.
 */
export async function getEffectiveModules(): Promise<ModulesConfig> {
  const overrides = await readOverrides();
  const effective: ModulesConfig = {
    platform:    { ...modulesConfig.platform },
    app:         { ...modulesConfig.app },
    services:    { ...modulesConfig.services },
    pageBuilder: { ...modulesConfig.pageBuilder },
  };
  for (const [path, value] of Object.entries(overrides)) {
    if (typeof value !== 'boolean') continue;
    const [cat, leaf] = path.split('.') as [keyof ModulesConfig, string];
    const group = effective[cat] as unknown as Record<string, boolean>;
    if (group && leaf in group) group[leaf] = value;
  }
  return effective;
}

/** Read effective state for one path (server-side, always async). */
export async function isModuleEnabledNow(path: ModulePath): Promise<boolean> {
  const effective = await getEffectiveModules();
  const [cat, leaf] = path.split('.') as [keyof ModulesConfig, string];
  const group = effective[cat] as unknown as Record<string, boolean> | undefined;
  return Boolean(group?.[leaf]);
}
