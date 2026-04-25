import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistory } from '../use-history';

describe('useHistory', () => {
  it('starts with the initial state and no undo/redo', () => {
    const { result } = renderHook(() => useHistory({ a: 1 }));
    expect(result.current.state).toEqual({ a: 1 });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('set pushes onto past and clears future', () => {
    const { result } = renderHook(() => useHistory({ a: 1 }));
    act(() => result.current.set({ a: 2 }));
    expect(result.current.state).toEqual({ a: 2 });
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('functional set sees the latest present value', () => {
    const { result } = renderHook(() => useHistory({ count: 0 }));
    act(() => result.current.set((prev) => ({ count: prev.count + 1 })));
    act(() => result.current.set((prev) => ({ count: prev.count + 1 })));
    expect(result.current.state).toEqual({ count: 2 });
  });

  it('undo returns to the previous state and enables redo', () => {
    const { result } = renderHook(() => useHistory({ a: 1 }));
    act(() => result.current.set({ a: 2 }));
    act(() => result.current.undo());
    expect(result.current.state).toEqual({ a: 1 });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('redo restores the most-recently undone state', () => {
    const { result } = renderHook(() => useHistory({ a: 1 }));
    act(() => result.current.set({ a: 2 }));
    act(() => result.current.undo());
    act(() => result.current.redo());
    expect(result.current.state).toEqual({ a: 2 });
    expect(result.current.canRedo).toBe(false);
  });

  it('a new set after undo wipes the future stack', () => {
    const { result } = renderHook(() => useHistory({ a: 1 }));
    act(() => result.current.set({ a: 2 }));
    act(() => result.current.undo());
    act(() => result.current.set({ a: 3 }));
    expect(result.current.state).toEqual({ a: 3 });
    expect(result.current.canRedo).toBe(false);
  });

  it('reset clears history and replaces the state', () => {
    const { result } = renderHook(() => useHistory({ a: 1 }));
    act(() => result.current.set({ a: 2 }));
    act(() => result.current.reset({ a: 99 }));
    expect(result.current.state).toEqual({ a: 99 });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('replace updates state without pushing onto the past stack', () => {
    const { result } = renderHook(() => useHistory({ a: 1 }));
    act(() => result.current.set({ a: 2 }));
    act(() => result.current.replace({ a: 5 }));
    expect(result.current.state).toEqual({ a: 5 });
    // Only the original transition is in past (no new entry from replace).
    act(() => result.current.undo());
    expect(result.current.state).toEqual({ a: 1 });
  });

  it('caps history at the configured limit', () => {
    const { result } = renderHook(() => useHistory({ n: 0 }, { limit: 3 }));
    act(() => result.current.set({ n: 1 }));
    act(() => result.current.set({ n: 2 }));
    act(() => result.current.set({ n: 3 }));
    act(() => result.current.set({ n: 4 }));
    // Past should be capped to 3 entries; oldest dropped.
    act(() => result.current.undo());
    act(() => result.current.undo());
    act(() => result.current.undo());
    expect(result.current.state).toEqual({ n: 1 });
    expect(result.current.canUndo).toBe(false);
  });
});
