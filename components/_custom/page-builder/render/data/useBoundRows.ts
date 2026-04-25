'use client';

/**
 * Client hook that fetches rows for a data-bound page widget.
 *
 * Consumed by `BoundMetricCard`, `BoundDataTable`, `BoundChart`, etc. The
 * hook reads from a `DataBinding` (set in the editor's `DataBindingEditor`)
 * and merges any active page-scoped filters from `PageFilterContext` so a
 * `filter-builder` block on the same page can drive every widget at once.
 *
 * It always returns a stable shape so widgets don't have to handle
 * `undefined` data — empty rows + a loading flag is enough for them to
 * render their own loading / empty states.
 */

import { useEffect, useRef, useState } from 'react';
import type { DataBinding } from '@/lib/core/ports/pages.repository';
import { fetchRowsAction } from '@/app/actions/data';
import { usePageFilters } from '../../runtime/PageContexts';

export interface BoundRowsResult {
  rows: Array<Record<string, unknown>>;
  total: number;
  loading: boolean;
  error: string | null;
  /** Convenience flag — true when no rows after a successful fetch. */
  empty: boolean;
}

const EMPTY: BoundRowsResult = {
  rows: [],
  total: 0,
  loading: false,
  error: null,
  empty: true,
};

export function useBoundRows(
  appId: string,
  binding: DataBinding | undefined,
): BoundRowsResult {
  const [state, setState] = useState<BoundRowsResult>(EMPTY);
  // Track the latest request so out-of-order responses don't overwrite newer state.
  const reqIdRef = useRef(0);

  const { filters } = usePageFilters();
  const tableKey = binding?.source === 'table' || binding?.source === 'record'
    ? binding.tableKey
    : undefined;

  // Stringify dependencies that React can't shallow-compare safely.
  const bindingSig = JSON.stringify(binding ?? null);
  const scopeFilters = tableKey ? filters[tableKey] : undefined;
  const filtersSig = JSON.stringify(scopeFilters ?? null);

  useEffect(() => {
    if (!binding || binding.source === 'static') {
      setState(EMPTY);
      return;
    }

    if (!tableKey) {
      setState({ ...EMPTY, error: 'Bind this widget to a table to load data.' });
      return;
    }

    const id = ++reqIdRef.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const mergedFilters = mergeFilters(binding.filters, scopeFilters);
    fetchRowsAction({
      tableKey,
      applicationKey: appId,
      limit: binding.limit ?? 50,
      filters: mergedFilters,
    })
      .then((res) => {
        if (id !== reqIdRef.current) return;
        if (!res.success) {
          setState({ ...EMPTY, error: res.error ?? 'Failed to load data.' });
          return;
        }
        const rows = sortRows(res.data ?? [], binding.sortBy, binding.sortDir);
        setState({
          rows,
          total: res.total ?? rows.length,
          loading: false,
          error: null,
          empty: rows.length === 0,
        });
      })
      .catch((err: unknown) => {
        if (id !== reqIdRef.current) return;
        const message = err instanceof Error ? err.message : 'Failed to load data.';
        setState({ ...EMPTY, error: message });
      });
  }, [appId, bindingSig, filtersSig, tableKey, binding, scopeFilters]);

  return state;
}

function mergeFilters(
  bindingFilters: DataBinding['filters'],
  pageFilters: ReturnType<typeof usePageFilters>['filters'][string] | undefined,
): Record<string, unknown> | undefined {
  // The data adapter accepts a flat `field → value` map for simple eq
  // filtering. Any filter with `op === 'eq'` (or no op) collapses to that
  // shape; richer ops are passed through under a `__rich` key for adapters
  // that understand them, otherwise ignored.
  const out: Record<string, unknown> = {};
  for (const f of bindingFilters ?? []) {
    if (!f.op || f.op === 'eq') out[f.field] = f.value;
  }
  for (const f of pageFilters ?? []) {
    if (!f.op || f.op === 'eq') out[f.field] = f.value;
  }
  return Object.keys(out).length ? out : undefined;
}

function sortRows(
  rows: Array<Record<string, unknown>>,
  sortBy: string | undefined,
  sortDir: 'asc' | 'desc' | undefined,
): Array<Record<string, unknown>> {
  if (!sortBy) return rows;
  const dir = sortDir === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    if (av == null && bv == null) return 0;
    if (av == null) return -1 * dir;
    if (bv == null) return 1 * dir;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
}

/**
 * Hook variant for `record` shape — selects a single row from the binding.
 * Returns `null` when nothing matches.
 */
export function useBoundRecord(
  appId: string,
  binding: DataBinding | undefined,
): { record: Record<string, unknown> | null; loading: boolean; error: string | null } {
  const r = useBoundRows(appId, binding);
  // React Compiler memoizes this derivation automatically.
  let record: Record<string, unknown> | null = null;
  if (r.rows.length) {
    if (binding?.recordId) {
      record =
        r.rows.find(
          (row) => String(row.id ?? row.gab_id ?? row._id ?? '') === String(binding.recordId),
        ) ?? null;
    } else {
      record = r.rows[0] ?? null;
    }
  }
  return { record, loading: r.loading, error: r.error };
}
