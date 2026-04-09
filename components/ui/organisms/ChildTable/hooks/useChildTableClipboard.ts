'use client';

import { useCallback, useRef, useState } from 'react';

import type {
  CellRange,
  ChildTableColumn,
  ChildTableConfig,
  ChildTableRow,
} from '../core/models';
import { normalizeRange } from '../core/models';
import { coerceValue, getDefaultValue } from '../core/validators';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BadPasteSnapshot<T> {
  /** Map of rowId → columnKey → previous value before the paste. */
  cells: Map<string, Map<string, unknown>>;
  /** A human-readable summary of what went wrong. */
  errorSummary: string;
  /** Rows as they were before the paste, keyed by rowId. */
  rowSnapshots: Map<string, T>;
}

interface ClipboardCallbacks {
  /** Update a single cell value in the table state. */
  setCellValue: (rowId: string, columnKey: string, value: unknown) => void;
  /** Show a WCAG-compliant alert modal to the user. */
  showAlert: (title: string, message: string, onDismiss?: () => void) => void;
}

interface ClipboardState {
  /** The internal clipboard buffer (rows × columns of string values). */
  internalClipboard: string[][];
  /** When true a paste produced coercion errors; the table should block edits until resolved. */
  pasteErrorLocked: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Clipboard operations (copy / cut / paste / undo) for the ChildTable.
 *
 * Ported from the Angular `ChildTableClipboardService`.
 *
 * @remarks
 * - Copies cell ranges or checkbox-selected rows as tab-separated values.
 * - Paste parses TSV from the system clipboard, coerces each value through
 *   `coerceValue`, and locks the table when coercion errors are detected.
 * - `undoBadPaste` restores the pre-paste snapshot in one step.
 */
export function useChildTableClipboard<T extends Record<string, unknown>>() {
  const [state, setState] = useState<ClipboardState>({
    internalClipboard: [],
    pasteErrorLocked: false,
  });

  const badPasteRef = useRef<BadPasteSnapshot<T> | null>(null);

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /**
   * Build a TSV string from a 2-D array of cell values.
   * Handles quoting when a value contains a tab or newline.
   */
  const buildTsv = useCallback((grid: string[][]): string => {
    return grid
      .map((row) =>
        row
          .map((cell = '') => {
            if (cell.includes('\t') || cell.includes('\n') || cell.includes('"')) {
              return `"${cell.replaceAll('"', '""')}"`;
            }
            return cell;
          })
          .join('\t'),
      )
      .join('\n');
  }, []);

  /** Resolve the display value of a cell as a string. */
  const cellToString = useCallback(
    (row: ChildTableRow<T>, col: ChildTableColumn<T>): string => {
      const val = row.data[col.key];
      if (val == null) return '';
      if (Array.isArray(val)) return val.join(', ');
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    },
    [],
  );

  /**
   * Extract a 2-D grid of string values from either the active cell range
   * or from the currently checkbox-selected rows.
   */
  const extractSelection = useCallback(
    (
      visibleRows: ChildTableRow<T>[],
      visibleColumns: ChildTableColumn<T>[],
      displayRows: ChildTableRow<T>[],
      selectedIds: Set<string>,
      range?: CellRange | null,
    ): string[][] => {
      if (range) {
        const { minRow, maxRow, minCol, maxCol } = normalizeRange(range);
        const grid: string[][] = [];
        for (let r = minRow; r <= maxRow; r++) {
          const row = visibleRows[r];
          if (!row) continue;
          const cells: string[] = [];
          for (let c = minCol; c <= maxCol; c++) {
            const col = visibleColumns[c];
            if (!col) continue;
            cells.push(cellToString(row, col));
          }
          grid.push(cells);
        }
        return grid;
      }

      if (selectedIds.size > 0) {
        const grid: string[][] = [];
        for (const row of displayRows) {
          if (!selectedIds.has(row.id)) continue;
          grid.push(visibleColumns.map((col) => cellToString(row, col)));
        }
        return grid;
      }

      return [];
    },
    [cellToString],
  );

  /** Parse a TSV/clipboard string into a 2-D array of strings. */
  const parseTsv = useCallback((text: string): string[][] => {
    const rows: string[][] = [];
    let current = '';
    let inQuotes = false;
    let row: string[] = [];

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];

      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === '\t') {
        row.push(current);
        current = '';
      } else if (ch === '\n') {
        row.push(current);
        current = '';
        rows.push(row);
        row = [];
      } else if (ch === '\r') {
        // skip carriage return; the following \n will commit the row
      } else {
        current += ch;
      }
    }

    // Flush remaining
    if (current || row.length > 0) {
      row.push(current);
      rows.push(row);
    }

    return rows;
  }, []);

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Copy the current selection to the system clipboard as TSV.
   *
   * @param visibleRows  - Page-sliced rows visible in the viewport.
   * @param visibleColumns - Currently visible (non-hidden) columns.
   * @param displayRows  - All rows after filtering/sorting (for checkbox selection).
   * @param selectedIds  - Set of checkbox-selected row IDs.
   * @param range        - Active cell-range selection (optional).
   */
  const onCopyAction = useCallback(
    (
      visibleRows: ChildTableRow<T>[],
      visibleColumns: ChildTableColumn<T>[],
      displayRows: ChildTableRow<T>[],
      selectedIds: Set<string>,
      range?: CellRange | null,
      event?: ClipboardEvent,
    ) => {
      const grid = extractSelection(
        visibleRows,
        visibleColumns,
        displayRows,
        selectedIds,
        range,
      );
      if (grid.length === 0) return;

      const tsv = buildTsv(grid);
      if (event?.clipboardData) {
        event.clipboardData.setData('text/plain', tsv);
        event.preventDefault();
      } else {
        navigator.clipboard.writeText(tsv).catch(() => {});
      }

      setState((prev) => ({ ...prev, internalClipboard: grid }));
    },
    [buildTsv, extractSelection],
  );

  /**
   * Cut = copy + clear editable cells in the selection.
   * Non-editable or readonly cells are copied but not cleared.
   */
  const onCutAction = useCallback(
    (
      visibleRows: ChildTableRow<T>[],
      visibleColumns: ChildTableColumn<T>[],
      displayRows: ChildTableRow<T>[],
      selectedIds: Set<string>,
      config: ChildTableConfig<T>,
      range: CellRange | null | undefined,
      callbacks: Pick<ClipboardCallbacks, 'setCellValue'> & { event?: ClipboardEvent },
    ) => {
      onCopyAction(visibleRows, visibleColumns, displayRows, selectedIds, range, callbacks.event);

      if (config.readonly) return;

      if (range) {
        const { minRow, maxRow, minCol, maxCol } = normalizeRange(range);
        for (let r = minRow; r <= maxRow; r++) {
          const row = visibleRows[r];
          if (!row) continue;
          for (let c = minCol; c <= maxCol; c++) {
            const col = visibleColumns[c];
            if (!col || col.editable === false) continue;
            callbacks.setCellValue(row.id, col.key, getDefaultValue(col.type));
          }
        }
        return;
      }

      if (selectedIds.size > 0) {
        for (const row of displayRows) {
          if (!selectedIds.has(row.id)) continue;
          for (const col of visibleColumns) {
            if (col.editable === false) continue;
            callbacks.setCellValue(row.id, col.key, getDefaultValue(col.type));
          }
        }
      }
    },
    [onCopyAction],
  );

  /**
   * Paste TSV data from the system clipboard into the table starting at the
   * given anchor position.
   *
   * Type coercion is applied per-column. If any cell fails coercion the table
   * enters `pasteErrorLocked` mode and a `badPasteSnapshot` is stored for undo.
   */
  const onPasteAction = useCallback(
    async (
      event: ClipboardEvent,
      anchorRow: number,
      anchorCol: number,
      visibleRows: ChildTableRow<T>[],
      visibleColumns: ChildTableColumn<T>[],
      config: ChildTableConfig<T>,
      callbacks: ClipboardCallbacks,
    ) => {
      if (config.readonly) return;

      const clipText = event.clipboardData?.getData('text/plain');
      if (!clipText) return;

      event.preventDefault();

      const parsed = parseTsv(clipText);
      if (parsed.length === 0) return;

      const errors: string[] = [];
      const snapshot = new Map<string, Map<string, unknown>>();
      const rowSnapshots = new Map<string, T>();

      for (let ri = 0; ri < parsed.length; ri++) {
        const targetRowIdx = anchorRow + ri;
        const row = visibleRows[targetRowIdx];
        if (!row) break;

        if (!rowSnapshots.has(row.id)) {
          rowSnapshots.set(row.id, { ...row.data });
        }

        for (let ci = 0; ci < parsed[ri].length; ci++) {
          const targetColIdx = anchorCol + ci;
          const col = visibleColumns[targetColIdx];
          if (!col) break;
          if (col.editable === false) continue;

          const rawValue = parsed[ri][ci];
          const result = coerceValue(rawValue, col.type);

          // Save previous value for undo
          let cellMap = snapshot.get(row.id);
          if (!cellMap) {
            cellMap = new Map();
            snapshot.set(row.id, cellMap);
          }
          cellMap.set(col.key, row.data[col.key]);

          if (result.error) {
            errors.push(
              `Row ${targetRowIdx + 1}, "${col.label}": ${result.error}`,
            );
            // Still write the raw value so the user can see what went wrong
            callbacks.setCellValue(row.id, col.key, result.value);
          } else {
            callbacks.setCellValue(row.id, col.key, result.value);
          }
        }
      }

      if (errors.length > 0) {
        const summary =
          errors.length <= 5
            ? errors.join('\n')
            : errors.slice(0, 5).join('\n') +
              `\n…and ${errors.length - 5} more error(s).`;

        // Atomic rollback: revert ALL cells (including valid ones) so paste is all-or-nothing
        for (const [rowId, cellMap] of snapshot) {
          for (const [colKey, prevValue] of cellMap) {
            callbacks.setCellValue(rowId, colKey, prevValue);
          }
        }

        badPasteRef.current = {
          cells: snapshot,
          errorSummary: summary,
          rowSnapshots,
        };

        setState((prev) => ({
          ...prev,
          pasteErrorLocked: true,
        }));

        const modKey = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent) ? '⌘' : 'Ctrl';
        callbacks.showAlert(
          'Paste errors detected',
          `Some pasted values could not be converted:\n\n${summary}\n\nThe paste was rolled back. Fix the source data and try again, or press ${modKey}+Z to dismiss.`,
        );
      }
    },
    [parseTsv],
  );

  /**
   * Revert the last paste that caused coercion errors.
   *
   * @param setCellValue - Callback to restore each cell value.
   */
  const undoBadPaste = useCallback(
    (setCellValue: (rowId: string, columnKey: string, value: unknown) => void) => {
      const snap = badPasteRef.current;
      if (!snap) return;

      for (const [rowId, cells] of snap.cells) {
        for (const [colKey, prevValue] of cells) {
          setCellValue(rowId, colKey, prevValue);
        }
      }

      badPasteRef.current = null;
      setState((prev) => ({
        ...prev,
        pasteErrorLocked: false,
      }));
    },
    [],
  );

  /** Clean up refs on unmount. */
  const destroy = useCallback(() => {
    badPasteRef.current = null;
    setState({ internalClipboard: [], pasteErrorLocked: false });
  }, []);

  return {
    /** Current internal clipboard buffer. */
    internalClipboard: state.internalClipboard,
    /** Whether a recent paste produced type-coercion errors. */
    pasteErrorLocked: state.pasteErrorLocked,
    /** Snapshot of the last bad paste (null when none). */
    badPasteSnapshot: badPasteRef.current,
    onCopyAction,
    onCutAction,
    onPasteAction,
    undoBadPaste,
    destroy,
  } as const;
}
