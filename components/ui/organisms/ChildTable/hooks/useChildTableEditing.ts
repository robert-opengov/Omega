'use client';

import { useCallback, useRef, useState } from 'react';

import type {
  ChildTableColumn,
  ChildTableConfig,
  ChildTableRow,
  ChildTableState,
} from '../core/models';
import { validateCell } from '../core/validators';

import type { UseChildTableStateReturn } from './useChildTableState';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CellChange {
  rowId: string;
  columnKey: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface SaveEditResult {
  saved: boolean;
  cellChange?: CellChange;
  validationError?: string;
}

export interface UseChildTableEditingReturn<T extends Record<string, unknown>> {
  /** The value currently held by the inline editor. */
  editingValue: unknown;
  /** Set the editor value (used by controlled input components). */
  setEditingValue: React.Dispatch<React.SetStateAction<unknown>>;
  /** True during the brief animation/transition between edits. */
  editTransitionActive: boolean;

  startEditing: (rowId: string, columnKey: string) => boolean;
  saveEdit: () => SaveEditResult;
  saveEditQuietly: () => SaveEditResult;
  cancelEdit: () => void;
  onTabSave: (value: unknown, shiftKey: boolean, colIndex: number) => SaveEditResult;
}

/**
 * Cell editor lifecycle hook for the ChildTable.
 *
 * Manages the inline editor value and provides start/save/cancel
 * semantics. Validates on save and writes back through the parent
 * `useChildTableState` methods.
 *
 * @param tableState - Return value of `useChildTableState`
 * @param config     - Table configuration
 * @param visibleRows - Currently visible rows (page slice)
 * @param visibleColumns - Currently visible columns
 * @param tableRef   - Ref to the table container element (for focus management)
 *
 * @example
 * ```tsx
 * const editing = useChildTableEditing(tableState, config, pageRows, cols, tableRef);
 * editing.startEditing(rowId, 'name');
 * ```
 */
export function useChildTableEditing<T extends Record<string, unknown> = Record<string, unknown>>(
  tableState: UseChildTableStateReturn<T>,
  config: ChildTableConfig<T>,
  visibleRows: ChildTableRow<T>[],
  visibleColumns: ChildTableColumn<T>[],
  tableRef: React.RefObject<HTMLElement | null>,
): UseChildTableEditingReturn<T> {
  const [editingValue, setEditingValue] = useState<unknown>(null);
  const [editTransitionActive, setEditTransitionActive] = useState(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { state, startEditing: stateStartEditing, stopEditing, updateCell, setCellError } = tableState;

  /**
   * Begin editing a cell. Returns `false` if the cell is not editable
   * (readonly config, non-editable column, formula column, etc.).
   */
  const startEditing = useCallback(
    (rowId: string, columnKey: string): boolean => {
      if (config.readonly) return false;

      const column = visibleColumns.find((c) => c.key === columnKey);
      if (!column) return false;
      if (column.editable === false) return false;
      if (column.type === 'formula') return false;

      const row = visibleRows.find((r) => r.id === rowId);
      if (!row) return false;

      const currentValue = row.data[columnKey as keyof T];
      setEditingValue(currentValue);
      stateStartEditing(rowId, columnKey);
      return true;
    },
    [config.readonly, visibleColumns, visibleRows, stateStartEditing],
  );

  /**
   * Validate and persist the current editor value.
   * Returns `{ saved: true, cellChange }` on success, or
   * `{ saved: false, validationError }` on failure.
   */
  const performSave = useCallback(
    (restoreFocus: boolean): SaveEditResult => {
      const cell = state.editingCell;
      if (!cell) return { saved: false };

      const column = visibleColumns.find((c) => c.key === cell.columnKey);
      if (!column) {
        stopEditing();
        return { saved: false };
      }

      const row = visibleRows.find((r) => r.id === cell.rowId);
      const error = validateCell(column.validation, editingValue, row?.data);

      if (error) {
        setCellError(cell.rowId, cell.columnKey, error);
        return { saved: false, validationError: error };
      }

      setCellError(cell.rowId, cell.columnKey, null);

      const cellChange: CellChange = {
        rowId: cell.rowId,
        columnKey: cell.columnKey,
        oldValue: cell.originalValue,
        newValue: editingValue,
      };

      updateCell(cell.rowId, cell.columnKey, editingValue);
      stopEditing();

      if (restoreFocus) {
        requestAnimationFrame(() => {
          tableRef.current?.focus();
        });
      }

      return { saved: true, cellChange };
    },
    [state.editingCell, visibleColumns, visibleRows, editingValue, stopEditing, updateCell, setCellError, tableRef],
  );

  const saveEdit = useCallback((): SaveEditResult => {
    return performSave(true);
  }, [performSave]);

  const saveEditQuietly = useCallback((): SaveEditResult => {
    return performSave(false);
  }, [performSave]);

  /**
   * Discard the current edit and restore the original cell value.
   */
  const cancelEdit = useCallback(() => {
    const cell = state.editingCell;
    if (cell) {
      setCellError(cell.rowId, cell.columnKey, null);
    }
    setEditingValue(null);
    stopEditing();
    requestAnimationFrame(() => {
      tableRef.current?.focus();
    });
  }, [state.editingCell, stopEditing, setCellError, tableRef]);

  /**
   * Save the current cell and advance to the next (or previous if Shift)
   * editable column. Used when Tab is pressed inside an inline editor.
   */
  const onTabSave = useCallback(
    (value: unknown, shiftKey: boolean, colIndex: number): SaveEditResult => {
      setEditingValue(value);

      const cell = state.editingCell;
      if (!cell) return { saved: false };

      const column = visibleColumns.find((c) => c.key === cell.columnKey);
      if (!column) {
        stopEditing();
        return { saved: false };
      }

      const row = visibleRows.find((r) => r.id === cell.rowId);
      const error = validateCell(column.validation, value, row?.data);

      if (error) {
        setCellError(cell.rowId, cell.columnKey, error);
        return { saved: false, validationError: error };
      }

      setCellError(cell.rowId, cell.columnKey, null);

      const cellChange: CellChange = {
        rowId: cell.rowId,
        columnKey: cell.columnKey,
        oldValue: cell.originalValue,
        newValue: value,
      };

      updateCell(cell.rowId, cell.columnKey, value);
      stopEditing();

      // Start transition to next editable cell
      setEditTransitionActive(true);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = setTimeout(() => setEditTransitionActive(false), 50);

      const step = shiftKey ? -1 : 1;
      let nextColIdx = colIndex + step;
      const rowId = cell.rowId;

      while (nextColIdx >= 0 && nextColIdx < visibleColumns.length) {
        const nextCol = visibleColumns[nextColIdx];
        if (nextCol && nextCol.editable !== false && nextCol.type !== 'formula') {
          requestAnimationFrame(() => {
            stateStartEditing(rowId, nextCol.key);
            const nextRow = visibleRows.find((r) => r.id === rowId);
            if (nextRow) setEditingValue(nextRow.data[nextCol.key as keyof T]);
          });
          break;
        }
        nextColIdx += step;
      }

      return { saved: true, cellChange };
    },
    [state.editingCell, visibleColumns, visibleRows, stopEditing, updateCell, setCellError, stateStartEditing],
  );

  return {
    editingValue,
    setEditingValue,
    editTransitionActive,
    startEditing,
    saveEdit,
    saveEditQuietly,
    cancelEdit,
    onTabSave,
  };
}
