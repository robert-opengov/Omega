'use client';

import { useCallback, useRef, useState } from 'react';

import type {
  CellPosition,
  CellRange,
  ChildTableColumn,
  ChildTableConfig,
  ChildTableRow,
  EditingCell,
} from '../core/models';
import { KEYBOARD_SHORTCUTS, NAVIGATION_KEYS } from '../core/models';
import { IS_MAC } from '../core/grid-utils';
import { getDefaultValue } from '../core/validators';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Header interaction modes when keyboard-navigating column headers. */
export type HeaderInteractionMode = 'none' | 'sort' | 'resize' | 'menu';

/**
 * Context bag passed into every keyboard handler so the hook stays stateless
 * with respect to the parent table's data / callbacks.
 */
export interface KeyboardContext<T extends Record<string, unknown>> {
  // Data
  visibleRows: ChildTableRow<T>[];
  visibleColumns: ChildTableColumn<T>[];
  config: ChildTableConfig<T>;
  editingCell: EditingCell | null;
  selectedIds: Set<string>;
  selectionRange: CellRange | null;

  // Callbacks
  startEditing: (rowId: string, columnKey: string) => void;
  commitEditing: () => void;
  cancelEditing: () => void;
  setCellValue: (rowId: string, columnKey: string, value: unknown) => void;
  setSelectedIds: (ids: Set<string>) => void;
  setSelectionRange: (range: CellRange | null) => void;
  toggleRowSelection: (rowId: string) => void;

  // Table actions
  onSort?: (column: string) => void;
  onAddRow?: () => void;
  onDeleteSelected?: () => void;
  onMoveRow?: (fromIndex: number, toIndex: number) => void;
  onSave?: () => void;

  // Clipboard
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: (event: KeyboardEvent) => void;

  // DOM
  tableRef: React.RefObject<HTMLElement | null>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CELL_SELECTOR = '[role="gridcell"], [role="columnheader"]';
const DATA_CELL_SELECTOR = '[role="gridcell"][data-row-index][data-col-index]';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Full keyboard navigation for the ChildTable spreadsheet component.
 *
 * Ported from the Angular `ChildTableKeyboardService`.
 *
 * @remarks
 * Implements a roving-tabindex pattern (WAI-ARIA grid) so only one cell is
 * tabbable at a time. Arrow keys, Tab, Enter, Escape, F2, Home, End, and
 * various Ctrl-combos are handled.
 */
export function useChildTableKeyboard<T extends Record<string, unknown>>() {
  const [focusedCell, setFocusedCell] = useState<CellPosition | null>(null);
  const [headerInteractionMode, setHeaderInteractionMode] =
    useState<HeaderInteractionMode>('none');
  const [headerInteractionColIndex, setHeaderInteractionColIndex] =
    useState<number>(-1);

  const programmaticFocusRef = useRef(false);

  // -----------------------------------------------------------------------
  // DOM helpers
  // -----------------------------------------------------------------------

  /** Query the table DOM for a cell at the given row/column data attributes. */
  const findCellElement = useCallback(
    (
      rowIndex: number,
      colIndex: number,
      tableRef: React.RefObject<HTMLElement | null>,
    ): HTMLElement | null => {
      if (!tableRef.current) return null;
      return tableRef.current.querySelector<HTMLElement>(
        `[data-row-index="${rowIndex}"][data-col-index="${colIndex}"]`,
      );
    },
    [],
  );

  /**
   * Programmatically move focus to a cell at the given position.
   * Sets `programmaticFocusActive` so the focus event handler can distinguish
   * user-initiated from code-initiated focus.
   */
  const focusCellByPosition = useCallback(
    (
      position: CellPosition,
      tableRef: React.RefObject<HTMLElement | null>,
    ) => {
      const el = findCellElement(position.rowIndex, position.columnIndex, tableRef);
      if (!el) return;

      programmaticFocusRef.current = true;
      updateRovingTabindex(el, tableRef);
      el.focus({ preventScroll: false });
      setFocusedCell(position);

      requestAnimationFrame(() => {
        programmaticFocusRef.current = false;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /**
   * Reset the roving tabindex so the first data cell in the grid has
   * `tabindex="0"` and all others have `tabindex="-1"`.
   */
  const resetRovingTabindex = useCallback(
    (tableRef: React.RefObject<HTMLElement | null>) => {
      if (!tableRef.current) return;
      const cells = tableRef.current.querySelectorAll<HTMLElement>(CELL_SELECTOR);
      cells.forEach((cell, i) => {
        cell.setAttribute('tabindex', i === 0 ? '0' : '-1');
      });
    },
    [],
  );

  /**
   * After moving focus to `cell`, set its tabindex to 0 and all siblings to -1.
   */
  const updateRovingTabindex = useCallback(
    (cell: HTMLElement, tableRef: React.RefObject<HTMLElement | null>) => {
      if (!tableRef.current) return;
      const cells = tableRef.current.querySelectorAll<HTMLElement>(CELL_SELECTOR);
      cells.forEach((c) => c.setAttribute('tabindex', '-1'));
      cell.setAttribute('tabindex', '0');
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Navigation primitives
  // -----------------------------------------------------------------------

  const moveFocus = useCallback(
    (
      rowDelta: number,
      colDelta: number,
      ctx: KeyboardContext<T>,
    ) => {
      const current = focusedCell;
      if (!current) return;

      const maxRow = ctx.visibleRows.length - 1;
      const maxCol = ctx.visibleColumns.length - 1;

      let nextRow = current.rowIndex + rowDelta;
      let nextCol = current.columnIndex + colDelta;

      // Wrap at row boundaries for horizontal movement
      if (colDelta !== 0) {
        if (nextCol > maxCol) {
          nextCol = 0;
          nextRow = Math.min(nextRow + 1, maxRow);
        } else if (nextCol < 0) {
          nextCol = maxCol;
          nextRow = Math.max(nextRow - 1, 0);
        }
      }

      nextRow = Math.max(0, Math.min(nextRow, maxRow));
      nextCol = Math.max(0, Math.min(nextCol, maxCol));

      if (nextRow === current.rowIndex && nextCol === current.columnIndex) return;

      focusCellByPosition({ rowIndex: nextRow, columnIndex: nextCol }, ctx.tableRef);
    },
    [focusedCell, focusCellByPosition],
  );

  /**
   * Tab to the next (or previous) editable cell.
   * Skips non-editable columns and wraps across rows.
   */
  const tabToNextEditable = useCallback(
    (forward: boolean, ctx: KeyboardContext<T>) => {
      const current = focusedCell;
      if (!current) return;

      const totalCols = ctx.visibleColumns.length;
      const totalRows = ctx.visibleRows.length;

      let r = current.rowIndex;
      let c = current.columnIndex + (forward ? 1 : -1);

      const visited = totalCols * totalRows;
      for (let i = 0; i < visited; i++) {
        if (c >= totalCols) {
          c = 0;
          r++;
        } else if (c < 0) {
          c = totalCols - 1;
          r--;
        }
        if (r >= totalRows || r < 0) break;

        const col = ctx.visibleColumns[c];
        if (col && col.editable !== false) {
          focusCellByPosition({ rowIndex: r, columnIndex: c }, ctx.tableRef);
          return;
        }
        c += forward ? 1 : -1;
      }
    },
    [focusedCell, focusCellByPosition],
  );

  // -----------------------------------------------------------------------
  // Modifier key helpers
  // -----------------------------------------------------------------------

  const isModKey = (e: KeyboardEvent): boolean =>
    IS_MAC ? e.metaKey : e.ctrlKey;

  const matchesShortcut = (
    e: KeyboardEvent,
    shortcut: { key: string; ctrlKey?: boolean; shiftKey?: boolean },
  ): boolean => {
    const modMatch = shortcut.ctrlKey ? isModKey(e) : !isModKey(e);
    const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey;
    return (
      e.key.toLowerCase() === shortcut.key.toLowerCase() &&
      modMatch &&
      shiftMatch
    );
  };

  // -----------------------------------------------------------------------
  // Selection helpers
  // -----------------------------------------------------------------------

  /** Extend or create a cell range from the focused cell in the given direction. */
  const extendSelection = useCallback(
    (rowDelta: number, colDelta: number, ctx: KeyboardContext<T>) => {
      const anchor = focusedCell;
      if (!anchor) return;

      const current = ctx.selectionRange ?? {
        anchorRow: anchor.rowIndex,
        anchorCol: anchor.columnIndex,
        focusRow: anchor.rowIndex,
        focusCol: anchor.columnIndex,
      };

      const maxRow = ctx.visibleRows.length - 1;
      const maxCol = ctx.visibleColumns.length - 1;

      const nextFocusRow = Math.max(0, Math.min(current.focusRow + rowDelta, maxRow));
      const nextFocusCol = Math.max(0, Math.min(current.focusCol + colDelta, maxCol));

      ctx.setSelectionRange({
        anchorRow: current.anchorRow,
        anchorCol: current.anchorCol,
        focusRow: nextFocusRow,
        focusCol: nextFocusCol,
      });
    },
    [focusedCell],
  );

  const selectAll = useCallback(
    (ctx: KeyboardContext<T>) => {
      if (ctx.visibleRows.length === 0 || ctx.visibleColumns.length === 0) return;
      ctx.setSelectionRange({
        anchorRow: 0,
        anchorCol: 0,
        focusRow: ctx.visibleRows.length - 1,
        focusCol: ctx.visibleColumns.length - 1,
      });
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Cell editing
  // -----------------------------------------------------------------------

  const startEditingFocused = useCallback(
    (ctx: KeyboardContext<T>) => {
      if (!focusedCell || ctx.config.readonly) return;
      const row = ctx.visibleRows[focusedCell.rowIndex];
      const col = ctx.visibleColumns[focusedCell.columnIndex];
      if (!row || !col || col.editable === false) return;
      ctx.startEditing(row.id, col.key);
    },
    [focusedCell],
  );

  const clearFocusedCell = useCallback(
    (ctx: KeyboardContext<T>) => {
      if (!focusedCell || ctx.config.readonly) return;
      const row = ctx.visibleRows[focusedCell.rowIndex];
      const col = ctx.visibleColumns[focusedCell.columnIndex];
      if (!row || !col || col.editable === false) return;
      ctx.setCellValue(row.id, col.key, getDefaultValue(col.type));
    },
    [focusedCell],
  );

  // -----------------------------------------------------------------------
  // Header keyboard handling
  // -----------------------------------------------------------------------

  /**
   * Handle keydown events originating from a column header cell.
   */
  const onHeaderKeydown = useCallback(
    (
      event: KeyboardEvent,
      columnKey: string,
      colIndex: number,
      ctx: KeyboardContext<T>,
    ) => {
      const { key } = event;

      if (headerInteractionMode !== 'none') {
        if (key === NAVIGATION_KEYS.ESCAPE) {
          event.preventDefault();
          setHeaderInteractionMode('none');
          setHeaderInteractionColIndex(-1);
          return;
        }
        // While in header interaction mode, let default behavior propagate
        return;
      }

      switch (key) {
        case NAVIGATION_KEYS.ENTER:
        case NAVIGATION_KEYS.SPACE: {
          event.preventDefault();
          if (ctx.onSort) ctx.onSort(columnKey);
          break;
        }
        case NAVIGATION_KEYS.ARROW_DOWN: {
          event.preventDefault();
          focusCellByPosition({ rowIndex: 0, columnIndex: colIndex }, ctx.tableRef);
          break;
        }
        case NAVIGATION_KEYS.ARROW_LEFT: {
          event.preventDefault();
          const prev = colIndex - 1;
          if (prev >= 0) {
            focusCellByPosition({ rowIndex: -1, columnIndex: prev }, ctx.tableRef);
          }
          break;
        }
        case NAVIGATION_KEYS.ARROW_RIGHT: {
          event.preventDefault();
          const next = colIndex + 1;
          if (next < ctx.visibleColumns.length) {
            focusCellByPosition({ rowIndex: -1, columnIndex: next }, ctx.tableRef);
          }
          break;
        }
        default:
          break;
      }
    },
    [headerInteractionMode, focusCellByPosition],
  );

  // -----------------------------------------------------------------------
  // Cell-level keyboard handling
  // -----------------------------------------------------------------------

  /**
   * Handle keydown events originating from a specific data cell.
   * This is the low-level handler attached to each cell element.
   */
  const onCellKeydown = useCallback(
    (
      event: KeyboardEvent,
      rowId: string,
      columnKey: string,
      rowIndex: number,
      colIndex: number,
      ctx: KeyboardContext<T>,
    ) => {
      // If a cell is being edited, only handle Escape / Enter / Tab
      if (ctx.editingCell) {
        switch (event.key) {
          case NAVIGATION_KEYS.ESCAPE:
            event.preventDefault();
            ctx.cancelEditing();
            break;
          case NAVIGATION_KEYS.ENTER:
            event.preventDefault();
            ctx.commitEditing();
            moveFocus(1, 0, ctx);
            break;
          case NAVIGATION_KEYS.TAB:
            event.preventDefault();
            ctx.commitEditing();
            tabToNextEditable(!event.shiftKey, ctx);
            break;
          default:
            break;
        }
        return;
      }

      // Update focused cell tracking
      if (
        focusedCell?.rowIndex !== rowIndex ||
        focusedCell?.columnIndex !== colIndex
      ) {
        setFocusedCell({ rowIndex, columnIndex: colIndex });
      }

      // Delegate to the table-level handler
      onKeydown(event, ctx);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focusedCell],
  );

  // -----------------------------------------------------------------------
  // Main keydown handler
  // -----------------------------------------------------------------------

  /**
   * Primary keydown handler for the table grid element.
   * Covers navigation, editing, selection, and shortcut keys.
   */
  const onKeydown = useCallback(
    (event: KeyboardEvent, ctx: KeyboardContext<T>) => {
      const { key } = event;

      // -- Editing state shortcuts -----------------------------------------
      if (ctx.editingCell) {
        if (key === NAVIGATION_KEYS.ESCAPE) {
          event.preventDefault();
          ctx.cancelEditing();
        } else if (key === NAVIGATION_KEYS.ENTER) {
          event.preventDefault();
          ctx.commitEditing();
          moveFocus(1, 0, ctx);
        } else if (key === NAVIGATION_KEYS.TAB) {
          event.preventDefault();
          ctx.commitEditing();
          tabToNextEditable(!event.shiftKey, ctx);
        }
        return;
      }

      // -- Modifier combos -------------------------------------------------
      if (isModKey(event)) {
        // Ctrl+Shift+Arrow: move row up/down
        if (event.shiftKey && ctx.onMoveRow && focusedCell) {
          if (matchesShortcut(event, KEYBOARD_SHORTCUTS.MOVE_ROW_UP)) {
            event.preventDefault();
            const from = focusedCell.rowIndex;
            if (from > 0) {
              ctx.onMoveRow(from, from - 1);
              setFocusedCell({ rowIndex: from - 1, columnIndex: focusedCell.columnIndex });
            }
            return;
          }
          if (matchesShortcut(event, KEYBOARD_SHORTCUTS.MOVE_ROW_DOWN)) {
            event.preventDefault();
            const from = focusedCell.rowIndex;
            if (from < ctx.visibleRows.length - 1) {
              ctx.onMoveRow(from, from + 1);
              setFocusedCell({ rowIndex: from + 1, columnIndex: focusedCell.columnIndex });
            }
            return;
          }
        }

        // Ctrl+A: select all
        if (matchesShortcut(event, KEYBOARD_SHORTCUTS.SELECT_ALL)) {
          event.preventDefault();
          selectAll(ctx);
          return;
        }

        // Ctrl+C / X / V -- let native copy/cut/paste events fire on the grid
        if (matchesShortcut(event, KEYBOARD_SHORTCUTS.COPY)
            || matchesShortcut(event, KEYBOARD_SHORTCUTS.CUT)
            || matchesShortcut(event, KEYBOARD_SHORTCUTS.PASTE)) {
          return;
        }

        // Ctrl+S: save
        if (matchesShortcut(event, KEYBOARD_SHORTCUTS.SAVE)) {
          event.preventDefault();
          ctx.onSave?.();
          return;
        }

        // Ctrl+Delete: delete selected
        if (matchesShortcut(event, KEYBOARD_SHORTCUTS.DELETE_ROW)) {
          event.preventDefault();
          ctx.onDeleteSelected?.();
          return;
        }

        // Ctrl+Home / Ctrl+End: jump to first/last row
        if (key === NAVIGATION_KEYS.HOME) {
          event.preventDefault();
          focusCellByPosition(
            { rowIndex: 0, columnIndex: focusedCell?.columnIndex ?? 0 },
            ctx.tableRef,
          );
          return;
        }
        if (key === NAVIGATION_KEYS.END) {
          event.preventDefault();
          focusCellByPosition(
            {
              rowIndex: ctx.visibleRows.length - 1,
              columnIndex: focusedCell?.columnIndex ?? 0,
            },
            ctx.tableRef,
          );
          return;
        }

        // Ctrl+Arrow: extend selection
        if (event.shiftKey === false) {
          // Plain Ctrl+Arrow not handled above -> ignore
          return;
        }
      }

      // -- Shift+Arrow: extend selection -----------------------------------
      if (event.shiftKey && !isModKey(event)) {
        switch (key) {
          case NAVIGATION_KEYS.ARROW_UP:
            event.preventDefault();
            extendSelection(-1, 0, ctx);
            return;
          case NAVIGATION_KEYS.ARROW_DOWN:
            event.preventDefault();
            extendSelection(1, 0, ctx);
            return;
          case NAVIGATION_KEYS.ARROW_LEFT:
            event.preventDefault();
            extendSelection(0, -1, ctx);
            return;
          case NAVIGATION_KEYS.ARROW_RIGHT:
            event.preventDefault();
            extendSelection(0, 1, ctx);
            return;
          default:
            break;
        }
      }

      // -- Arrow keys: simple focus move -----------------------------------
      switch (key) {
        case NAVIGATION_KEYS.ARROW_UP:
          event.preventDefault();
          ctx.setSelectionRange(null);
          moveFocus(-1, 0, ctx);
          return;
        case NAVIGATION_KEYS.ARROW_DOWN:
          event.preventDefault();
          ctx.setSelectionRange(null);
          moveFocus(1, 0, ctx);
          return;
        case NAVIGATION_KEYS.ARROW_LEFT:
          event.preventDefault();
          ctx.setSelectionRange(null);
          moveFocus(0, -1, ctx);
          return;
        case NAVIGATION_KEYS.ARROW_RIGHT:
          event.preventDefault();
          ctx.setSelectionRange(null);
          moveFocus(0, 1, ctx);
          return;
        default:
          break;
      }

      // -- Tab -------------------------------------------------------------
      if (key === NAVIGATION_KEYS.TAB) {
        event.preventDefault();
        ctx.setSelectionRange(null);
        tabToNextEditable(!event.shiftKey, ctx);
        return;
      }

      // -- Enter: start editing or toggle checkbox -------------------------
      if (key === NAVIGATION_KEYS.ENTER) {
        event.preventDefault();
        if (focusedCell) {
          const col = ctx.visibleColumns[focusedCell.columnIndex];
          if (col?.type === 'checkbox') {
            const row = ctx.visibleRows[focusedCell.rowIndex];
            if (row && col.editable !== false && !ctx.config.readonly) {
              const current = row.data[col.key];
              ctx.setCellValue(row.id, col.key, !current);
            }
          } else {
            startEditingFocused(ctx);
          }
        }
        return;
      }

      // -- F2: start editing -----------------------------------------------
      if (key === NAVIGATION_KEYS.F2) {
        event.preventDefault();
        startEditingFocused(ctx);
        return;
      }

      // -- Escape: cancel editing / clear selection ------------------------
      if (key === NAVIGATION_KEYS.ESCAPE) {
        event.preventDefault();
        if (ctx.editingCell) {
          ctx.cancelEditing();
        } else {
          ctx.setSelectionRange(null);
        }
        if (headerInteractionMode !== 'none') {
          setHeaderInteractionMode('none');
          setHeaderInteractionColIndex(-1);
        }
        return;
      }

      // -- Delete / Backspace: clear cell ----------------------------------
      if (
        key === NAVIGATION_KEYS.DELETE ||
        key === NAVIGATION_KEYS.BACKSPACE
      ) {
        event.preventDefault();
        clearFocusedCell(ctx);
        return;
      }

      // -- Home / End (without Ctrl): first/last column --------------------
      if (key === NAVIGATION_KEYS.HOME) {
        event.preventDefault();
        focusCellByPosition(
          { rowIndex: focusedCell?.rowIndex ?? 0, columnIndex: 0 },
          ctx.tableRef,
        );
        return;
      }
      if (key === NAVIGATION_KEYS.END) {
        event.preventDefault();
        focusCellByPosition(
          {
            rowIndex: focusedCell?.rowIndex ?? 0,
            columnIndex: ctx.visibleColumns.length - 1,
          },
          ctx.tableRef,
        );
        return;
      }

      // -- PageUp / PageDown: jump by visible page --------------------------
      if (key === NAVIGATION_KEYS.PAGE_UP) {
        event.preventDefault();
        ctx.setSelectionRange(null);
        if (focusedCell) {
          const jump = Math.max(1, ctx.visibleRows.length - 1);
          const nextRow = Math.max(0, focusedCell.rowIndex - jump);
          focusCellByPosition(
            { rowIndex: nextRow, columnIndex: focusedCell.columnIndex },
            ctx.tableRef,
          );
        }
        return;
      }
      if (key === NAVIGATION_KEYS.PAGE_DOWN) {
        event.preventDefault();
        ctx.setSelectionRange(null);
        if (focusedCell) {
          const jump = Math.max(1, ctx.visibleRows.length - 1);
          const nextRow = Math.min(
            ctx.visibleRows.length - 1,
            focusedCell.rowIndex + jump,
          );
          focusCellByPosition(
            { rowIndex: nextRow, columnIndex: focusedCell.columnIndex },
            ctx.tableRef,
          );
        }
        return;
      }

      // -- Insert: add row -------------------------------------------------
      if (matchesShortcut(event, KEYBOARD_SHORTCUTS.ADD_ROW)) {
        event.preventDefault();
        ctx.onAddRow?.();
        return;
      }

      // -- Space on checkbox column: toggle --------------------------------
      if (key === NAVIGATION_KEYS.SPACE && focusedCell) {
        const col = ctx.visibleColumns[focusedCell.columnIndex];
        if (col?.type === 'checkbox') {
          event.preventDefault();
          const row = ctx.visibleRows[focusedCell.rowIndex];
          if (row && col.editable !== false && !ctx.config.readonly) {
            const current = row.data[col.key];
            ctx.setCellValue(row.id, col.key, !current);
          }
        }
      }
    },
    [
      focusedCell,
      headerInteractionMode,
      moveFocus,
      tabToNextEditable,
      extendSelection,
      selectAll,
      startEditingFocused,
      clearFocusedCell,
      focusCellByPosition,
    ],
  );

  return {
    /** Currently focused cell position (null if none). */
    focusedCell,
    setFocusedCell,
    /** Current header interaction mode for the keyboard-active column header. */
    headerInteractionMode,
    /** Column index of the header currently in interaction mode (-1 = none). */
    headerInteractionColIndex,
    /** True while a programmatic focus move is in flight. */
    get programmaticFocusActive() {
      return programmaticFocusRef.current;
    },

    onKeydown,
    onCellKeydown,
    onHeaderKeydown,
    focusCellByPosition,
    resetRovingTabindex,
    updateRovingTabindex,
  } as const;
}
