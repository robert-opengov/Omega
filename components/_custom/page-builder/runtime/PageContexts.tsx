'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * PageFilterContext — global filters applied across data widgets on a page.
 *
 * GAB Core uses this so that adding a `filter-builder` to the page can drive
 * all `data-table` / `chart` / `kanban` widgets at once. Widgets read their
 * scope key (defaults to the bound table key) and merge any active filters.
 */

export type PageFilterValue = unknown;

export interface PageFilter {
  field: string;
  op: string;
  value: PageFilterValue;
}

interface PageFilterContextShape {
  /** Filters keyed by scope (usually tableKey or '*' for global). */
  filters: Record<string, PageFilter[]>;
  setFilters: (scope: string, filters: PageFilter[]) => void;
  clearFilters: (scope?: string) => void;
}

const PageFilterContext = createContext<PageFilterContextShape | null>(null);

export function PageFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<Record<string, PageFilter[]>>({});

  const setFilters = useCallback((scope: string, next: PageFilter[]) => {
    setFiltersState((prev) => ({ ...prev, [scope]: next }));
  }, []);

  const clearFilters = useCallback((scope?: string) => {
    if (!scope) {
      setFiltersState({});
    } else {
      setFiltersState((prev) => {
        const next = { ...prev };
        delete next[scope];
        return next;
      });
    }
  }, []);

  const value = useMemo(
    () => ({ filters, setFilters, clearFilters }),
    [filters, setFilters, clearFilters],
  );

  return <PageFilterContext.Provider value={value}>{children}</PageFilterContext.Provider>;
}

export function usePageFilters(): PageFilterContextShape {
  const ctx = useContext(PageFilterContext);
  if (!ctx) {
    return {
      filters: {},
      setFilters: () => undefined,
      clearFilters: () => undefined,
    };
  }
  return ctx;
}

/**
 * PageSelectionContext — tracks the "selected record" per scope on a page.
 *
 * Used by `conditional-container` (show only when a record is selected) and
 * by `detail-header` widgets to display the selection. Mirrors GAB Core's
 * cross-component selection bus.
 */

export interface PageSelection {
  tableKey: string;
  recordId: string;
}

interface PageSelectionContextShape {
  selection: Record<string, PageSelection | null>;
  select: (scope: string, sel: PageSelection | null) => void;
  isSelected: (scope: string) => boolean;
}

const PageSelectionContext = createContext<PageSelectionContextShape | null>(null);

export function PageSelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<Record<string, PageSelection | null>>({});

  const select = useCallback((scope: string, sel: PageSelection | null) => {
    setSelection((prev) => ({ ...prev, [scope]: sel }));
  }, []);

  const isSelected = useCallback(
    (scope: string) => Boolean(selection[scope]),
    [selection],
  );

  const value = useMemo(
    () => ({ selection, select, isSelected }),
    [selection, select, isSelected],
  );

  return (
    <PageSelectionContext.Provider value={value}>{children}</PageSelectionContext.Provider>
  );
}

export function usePageSelection(): PageSelectionContextShape {
  const ctx = useContext(PageSelectionContext);
  if (!ctx) {
    return {
      selection: {},
      select: () => undefined,
      isSelected: () => false,
    };
  }
  return ctx;
}

/**
 * Convenience wrapper used by both the editor preview and the runtime page.
 */
export function PageRuntimeProviders({ children }: { children: ReactNode }) {
  return (
    <PageFilterProvider>
      <PageSelectionProvider>{children}</PageSelectionProvider>
    </PageFilterProvider>
  );
}
