'use client';

import { useCallback, useState } from 'react';

import type { ChildTableConfig } from '../core/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DragHandleProps {
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  'aria-grabbed'?: boolean;
  'aria-dropeffect'?: 'move' | 'none';
  role: string;
  tabIndex: number;
}

export interface UseChildTableDndReturn {
  /** Index of the row currently being dragged (null when idle). */
  dragRowIndex: number | null;
  /** Index where the row will be dropped. */
  dropTargetIndex: number | null;
  /** True while a drag gesture is in progress. */
  isDragging: boolean;

  onDragStart: (rowIndex: number, event: React.DragEvent) => void;
  onDragOver: (rowIndex: number, event: React.DragEvent) => void;
  onDragEnd: () => void;

  /** Returns an attribute spread for a drag-handle element at the given row. */
  getDragHandleProps: (rowIndex: number) => DragHandleProps;
}

/**
 * Row drag-and-drop reordering hook for the ChildTable.
 *
 * Manages the lifecycle of an HTML5 drag gesture: dragstart → dragover →
 * dragend/drop, exposing the current drag/drop indices so the table can
 * render a visual drop indicator. Respects `config.rowReorderable` and
 * `config.readonly` — when either is false, dragging is disabled.
 *
 * @param config  - Table configuration (reads `rowReorderable`, `readonly`)
 * @param onReorder - Callback invoked with `(fromIndex, toIndex)` when a reorder completes
 *
 * @example
 * ```tsx
 * const dnd = useChildTableDnd(config, tableState.moveRow);
 * // Spread onto each row's drag handle: <span {...dnd.getDragHandleProps(i)} />
 * ```
 */
export function useChildTableDnd<T extends Record<string, unknown> = Record<string, unknown>>(
  config: ChildTableConfig<T>,
  onReorder: (fromIndex: number, toIndex: number) => void,
): UseChildTableDndReturn {
  const [dragRowIndex, setDragRowIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isEnabled = Boolean(config.rowReorderable) && !config.readonly;

  const onDragStart = useCallback(
    (rowIndex: number, event: React.DragEvent) => {
      if (!isEnabled) {
        event.preventDefault();
        return;
      }

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(rowIndex));

      setDragRowIndex(rowIndex);
      setDropTargetIndex(null);
      setIsDragging(true);
    },
    [isEnabled],
  );

  const onDragOver = useCallback(
    (rowIndex: number, event: React.DragEvent) => {
      if (!isDragging || dragRowIndex === null) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';

      if (rowIndex !== dropTargetIndex) {
        setDropTargetIndex(rowIndex);
      }
    },
    [isDragging, dragRowIndex, dropTargetIndex],
  );

  const onDragEnd = useCallback(() => {
    if (
      dragRowIndex !== null &&
      dropTargetIndex !== null &&
      dragRowIndex !== dropTargetIndex
    ) {
      onReorder(dragRowIndex, dropTargetIndex);
    }

    setDragRowIndex(null);
    setDropTargetIndex(null);
    setIsDragging(false);
  }, [dragRowIndex, dropTargetIndex, onReorder]);

  const getDragHandleProps = useCallback(
    (rowIndex: number): DragHandleProps => {
      return {
        draggable: isEnabled,
        onDragStart: (e: React.DragEvent) => onDragStart(rowIndex, e),
        onDragOver: (e: React.DragEvent) => onDragOver(rowIndex, e),
        onDragEnd,
        ...(isEnabled && {
          'aria-grabbed': isDragging && dragRowIndex === rowIndex,
          'aria-dropeffect': isDragging ? 'move' as const : 'none' as const,
        }),
        role: 'button',
        tabIndex: isEnabled ? 0 : -1,
      };
    },
    [isEnabled, isDragging, dragRowIndex, onDragStart, onDragOver, onDragEnd],
  );

  return {
    dragRowIndex,
    dropTargetIndex,
    isDragging,
    onDragStart,
    onDragOver,
    onDragEnd,
    getDragHandleProps,
  };
}
