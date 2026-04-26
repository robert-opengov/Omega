'use client';

/**
 * Client-side React context that mirrors the *effective* module config
 * (env baseline + cookie overrides) computed once per request on the
 * server and serialized into the initial provider value.
 *
 * Why a context instead of reading `document.cookie` directly?
 *   - Single source of truth: the server already merges baseline +
 *     overrides; re-implementing on the client invites drift.
 *   - Cheap: one boolean lookup per `useModuleEnabled` call, no parsing.
 *   - Predictable: when a server action mutates the cookie and calls
 *     `revalidatePath('/', 'layout')`, the new effective config flows
 *     down via the layout — no manual sync needed.
 *
 * Mutation flow:
 *   UI switch → `setModuleOverrideAction(path, value)` (server action)
 *     → cookie updated → `revalidatePath('/', 'layout')`
 *     → root layout re-renders → fresh `effective` passed into provider
 *     → every consumer re-renders with the new value.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  modulesConfig,
  type ModulePath,
  type ModulesConfig,
} from '@/config/modules.config';
import { isModuleEnabled as isModuleEnabledStatic } from '@/lib/features';

interface ModuleFlagsContextValue {
  /** Effective (baseline + overrides) module config for this request. */
  modules: ModulesConfig;
  /** Boolean lookup against the effective config, with safe fallback. */
  isEnabled: (path: ModulePath | string) => boolean;
}

const ModuleFlagsContext = createContext<ModuleFlagsContextValue | null>(null);

export interface ModuleFlagsProviderProps {
  /** Snapshot of effective modules captured server-side for this request. */
  initialModules?: ModulesConfig;
  children: ReactNode;
}

export function ModuleFlagsProvider({
  initialModules,
  children,
}: ModuleFlagsProviderProps) {
  const modules = initialModules ?? modulesConfig;

  const isEnabled = useCallback(
    (path: ModulePath | string) => {
      const segments = path.split('.');
      let cursor: unknown = modules;
      for (const segment of segments) {
        if (!cursor || typeof cursor !== 'object') return false;
        cursor = (cursor as Record<string, unknown>)[segment];
      }
      return cursor === true;
    },
    [modules],
  );

  const value = useMemo(() => ({ modules, isEnabled }), [modules, isEnabled]);

  return (
    <ModuleFlagsContext.Provider value={value}>{children}</ModuleFlagsContext.Provider>
  );
}

/**
 * Read the current effective state for one module flag.
 * Falls back to the static baseline if no `<ModuleFlagsProvider>` is
 * mounted (tests, isolated stories, server-rendered fragments).
 */
export function useModuleEnabled(path: ModulePath | string): boolean {
  const ctx = useContext(ModuleFlagsContext);
  if (!ctx) return isModuleEnabledStatic(path);
  return ctx.isEnabled(path);
}

/**
 * Read the entire effective module tree — handy for surfaces that need
 * to render multiple flags (admin UI, debug overlays).
 */
export function useModuleFlags(): ModulesConfig {
  const ctx = useContext(ModuleFlagsContext);
  return ctx?.modules ?? modulesConfig;
}
