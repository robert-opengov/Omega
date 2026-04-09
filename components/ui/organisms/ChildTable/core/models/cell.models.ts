/** Cell-level models for position, range selection, and value coercion. */

export interface CellPosition {
  rowIndex: number;
  columnIndex: number;
}

/**
 * Rectangular cell range for selection (anchor = start, focus = end).
 * Coordinates are page-relative row indices and data-column indices.
 */
export interface CellRange {
  anchorRow: number;
  anchorCol: number;
  focusRow: number;
  focusCol: number;
}

/** Normalize a CellRange into min/max bounds (anchor and focus can be in any order). */
export function normalizeRange(range: CellRange): {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
} {
  return {
    minRow: Math.min(range.anchorRow, range.focusRow),
    maxRow: Math.max(range.anchorRow, range.focusRow),
    minCol: Math.min(range.anchorCol, range.focusCol),
    maxCol: Math.max(range.anchorCol, range.focusCol),
  };
}

/**
 * Result of coercing a pasted/entered value for a specific column type.
 * If error is non-null the value should not be saved.
 */
export interface CoerceResult {
  value: unknown;
  error: string | null;
}

/** Configuration for the generic WCAG AA alert modal. */
export interface AlertModalConfig {
  title: string;
  message: string;
  buttonLabel: string;
  icon: 'warning' | 'info';
  onDismiss: () => void;
}
