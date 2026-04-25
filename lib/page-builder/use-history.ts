'use client';

/**
 * Generic history hook for the page editor.
 *
 * Wraps any state value in a past/present/future stack so we can offer
 * undo/redo (Cmd+Z / Cmd+Shift+Z). Mirrors the GAB Core editor's history
 * service, but small + dependency-free.
 *
 * Implementation notes:
 *   - The hook owns the full state — callers should call `set(next)`
 *     instead of using their own setter.
 *   - We compare `prev === next` by reference; updates that produce the
 *     same reference do nothing. Helpers in `layout-helpers.ts` always
 *     return new layouts, so reference equality is meaningful.
 *   - History is capped at `limit` entries (default 50) to keep React
 *     re-renders snappy.
 */

import { useCallback, useMemo, useRef, useState } from 'react';

export interface UseHistoryOptions {
  /** Maximum past + future entries (default 50). */
  limit?: number;
}

export interface UseHistoryReturn<T> {
  state: T;
  set: (next: T | ((prev: T) => T)) => void;
  /**
   * Replace the current state without pushing onto the past stack — useful
   * for syncing in props (e.g. a server refresh) without polluting history.
   */
  replace: (next: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (next: T) => void;
}

export function useHistory<T>(initial: T, opts: UseHistoryOptions = {}): UseHistoryReturn<T> {
  const limit = opts.limit ?? 50;
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initial);
  const [future, setFuture] = useState<T[]>([]);

  // Mirror the latest present into a ref so `set(prev => …)` callbacks
  // always see the freshest value when called inside event handlers.
  const presentRef = useRef(present);
  presentRef.current = present;

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const computed =
        typeof next === 'function'
          ? (next as (prev: T) => T)(presentRef.current)
          : next;
      if (computed === presentRef.current) return;
      setPast((p) => {
        const out = [...p, presentRef.current];
        if (out.length > limit) out.shift();
        return out;
      });
      setPresent(computed);
      setFuture([]);
    },
    [limit],
  );

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1]!;
      setFuture((f) => [presentRef.current, ...f]);
      setPresent(prev);
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const [next, ...rest] = f;
      setPast((p) => [...p, presentRef.current]);
      setPresent(next!);
      return rest;
    });
  }, []);

  const replace = useCallback((next: T) => {
    setPresent(next);
  }, []);

  const reset = useCallback((next: T) => {
    setPast([]);
    setFuture([]);
    setPresent(next);
  }, []);

  return useMemo(
    () => ({
      state: present,
      set,
      replace,
      undo,
      redo,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      reset,
    }),
    [present, set, replace, undo, redo, past.length, future.length, reset],
  );
}
