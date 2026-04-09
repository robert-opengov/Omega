'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { CellRange } from '../core/models';
import { normalizeRange } from '../core/models';

import type { UseChildTableA11yReturn } from './useChildTableA11y';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseChildTableSelectionReturn {
  /** Current rectangular cell range (null when no range is active). */
  cellRange: CellRange | null;
  /** True while the user is dragging to extend the range. */
  isDragging: boolean;

  onCellMouseDown: (shiftKey: boolean, rowIndex: number, colIndex: number) => void;
  onCellMouseEnter: (rowIndex: number, colIndex: number) => void;
  onDocumentMouseUp: () => void;
  clearCellRange: () => void;
  /**
   * Set the full cell range programmatically (anchor + focus) without engaging
   * the drag mechanism. Used by keyboard shortcuts and programmatic selection.
   */
  setCellRangeDirect: (range: CellRange | null) => void;
  /** Check if a cell sits on a specific edge of the selection rectangle. */
  isRangeEdge: (rowIndex: number, colIndex: number, edge: 'top' | 'bottom' | 'left' | 'right') => boolean;
  /** Announce via the a11y live region when the range spans more than one cell. */
  announceRangeIfMultiCell: () => void;
}

/**
 * Cell range selection hook for the ChildTable.
 *
 * Enables spreadsheet-style rectangular selection by tracking
 * mousedown → mousemove → mouseup across cells. Integrates with
 * the a11y hook to announce multi-cell selections to screen readers.
 *
 * @param a11y - Accessibility hook return (for announcements)
 *
 * @example
 * ```tsx
 * const selection = useChildTableSelection(a11y);
 * // wire onCellMouseDown / onCellMouseEnter to cell elements
 * ```
 */
export function useChildTableSelection(
  a11y: UseChildTableA11yReturn,
): UseChildTableSelectionReturn {
  const [cellRange, setCellRange] = useState<CellRange | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const rangeRef = useRef<CellRange | null>(null);
  const isDraggingRef = useRef(false);

  /**
   * Start a new selection or extend the existing one (Shift+click).
   */
  const onCellMouseDown = useCallback(
    (shiftKey: boolean, rowIndex: number, colIndex: number) => {
      if (shiftKey && rangeRef.current) {
        const extended: CellRange = {
          ...rangeRef.current,
          focusRow: rowIndex,
          focusCol: colIndex,
        };
        rangeRef.current = extended;
        setCellRange(extended);
      } else {
        const fresh: CellRange = {
          anchorRow: rowIndex,
          anchorCol: colIndex,
          focusRow: rowIndex,
          focusCol: colIndex,
        };
        rangeRef.current = fresh;
        setCellRange(fresh);
      }
      isDraggingRef.current = true;
      setIsDragging(true);
    },
    [],
  );

  /**
   * Extend the range to the hovered cell while the mouse button is held.
   * Uses a ref instead of state to avoid stale closures from React batching.
   */
  const onCellMouseEnter = useCallback(
    (rowIndex: number, colIndex: number) => {
      if (!isDraggingRef.current || !rangeRef.current) return;

      const updated: CellRange = {
        ...rangeRef.current,
        focusRow: rowIndex,
        focusCol: colIndex,
      };
      rangeRef.current = updated;
      setCellRange(updated);
    },
    [],
  );

  /**
   * Finalise the range on mouse release.
   */
  const onDocumentMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  // Attach a global mouseup listener so we catch releases outside the table
  useEffect(() => {
    if (!isDragging) return;

    const handler = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };
    document.addEventListener('mouseup', handler);
    return () => document.removeEventListener('mouseup', handler);
  }, [isDragging]);

  const clearCellRange = useCallback(() => {
    rangeRef.current = null;
    isDraggingRef.current = false;
    setCellRange(null);
    setIsDragging(false);
  }, []);

  const setCellRangeDirect = useCallback((range: CellRange | null) => {
    rangeRef.current = range;
    setCellRange(range);
  }, []);

  const isRangeEdge = useCallback(
    (rowIndex: number, colIndex: number, edge: 'top' | 'bottom' | 'left' | 'right'): boolean => {
      if (!rangeRef.current) return false;
      const { minRow, maxRow, minCol, maxCol } = normalizeRange(rangeRef.current);
      if (rowIndex < minRow || rowIndex > maxRow || colIndex < minCol || colIndex > maxCol) return false;
      switch (edge) {
        case 'top': return rowIndex === minRow;
        case 'bottom': return rowIndex === maxRow;
        case 'left': return colIndex === minCol;
        case 'right': return colIndex === maxCol;
      }
    },
    [],
  );

  /**
   * If the current range spans more than a single cell, announce
   * the dimensions to screen reader users.
   */
  const announceRangeIfMultiCell = useCallback(() => {
    const range = rangeRef.current;
    if (!range) return;

    const { minRow, maxRow, minCol, maxCol } = normalizeRange(range);
    const rows = maxRow - minRow + 1;
    const cols = maxCol - minCol + 1;

    if (rows > 1 || cols > 1) {
      a11y.announce(
        `Selected range: ${rows} row${rows === 1 ? '' : 's'} × ${cols} column${cols === 1 ? '' : 's'}`,
      );
    }
  }, [a11y]);

  return {
    cellRange,
    isDragging,
    onCellMouseDown,
    onCellMouseEnter,
    onDocumentMouseUp,
    clearCellRange,
    setCellRangeDirect,
    isRangeEdge,
    announceRangeIfMultiCell,
  };
}
