'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

import type {
  ChildTableColumn,
  ChildTableConfig,
  ChildTableEvents,
  ChildTableRow,
  ChildTableState,
  EditingCell,
  FilterConfig,
  SortConfig,
} from '../core/models';
import { getDefaultValue, validateCell } from '../core/validators';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTempId(): string {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/** Safely convert any value (including objects) to a string for display/comparison. */
function safeString(val: unknown): string {
  if (val == null) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function buildDefaultRowData<T extends Record<string, unknown>>(
  columns: ChildTableColumn<T>[],
): T {
  const data = {} as Record<string, unknown>;
  for (const col of columns) {
    data[col.key] = getDefaultValue(col.type);
  }
  return data as T;
}

function matchesSearch<T extends Record<string, unknown>>(
  row: ChildTableRow<T>,
  term: string,
  columns: ChildTableColumn<T>[],
): boolean {
  const lower = term.toLowerCase();
  for (const col of columns) {
    const val = row.data[col.key];
    if (val != null && safeString(val).toLowerCase().includes(lower)) return true;
  }
  return false;
}

function matchesFilter<T extends Record<string, unknown>>(
  row: ChildTableRow<T>,
  filter: FilterConfig,
): boolean {
  const cellValue = row.data[filter.column as keyof T];
  const cellStr = safeString(cellValue).toLowerCase();
  const filterStr = safeString(filter.value).toLowerCase();

  switch (filter.operator) {
    case 'equals':
      return cellStr === filterStr;
    case 'notEquals':
      return cellStr !== filterStr;
    case 'contains':
      return cellStr.includes(filterStr);
    case 'notContains':
      return !cellStr.includes(filterStr);
    case 'startsWith':
      return cellStr.startsWith(filterStr);
    case 'endsWith':
      return cellStr.endsWith(filterStr);
    case 'greaterThan':
      return Number(cellValue) > Number(filter.value);
    case 'lessThan':
      return Number(cellValue) < Number(filter.value);
    case 'between': {
      const [lo, hi] = Array.isArray(filter.value) ? filter.value : [0, 0];
      const n = Number(cellValue);
      return n >= Number(lo) && n <= Number(hi);
    }
    case 'isEmpty':
      return cellValue == null || cellValue === '';
    case 'isNotEmpty':
      return cellValue != null && cellValue !== '';
    default:
      return true;
  }
}

function compareValues(a: unknown, b: unknown, direction: 'asc' | 'desc'): number {
  const mult = direction === 'asc' ? 1 : -1;
  if (a == null && b == null) return 0;
  if (a == null) return mult;
  if (b == null) return -mult;
  if (typeof a === 'number' && typeof b === 'number') return (a - b) * mult;
  return safeString(a).localeCompare(safeString(b)) * mult;
}

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

type Action<T extends Record<string, unknown>> =
  | { type: 'SET_ROWS'; rows: ChildTableRow<T>[] }
  | { type: 'SET_COLUMNS'; columns: ChildTableColumn<T>[] }
  | { type: 'ADD_ROW'; row: ChildTableRow<T>; index?: number }
  | { type: 'DELETE_ROWS'; ids: string[] }
  | { type: 'UPDATE_CELL'; rowId: string; columnKey: string; value: unknown }
  | { type: 'TOGGLE_SORT'; column: string }
  | { type: 'ADD_FILTER'; filter: FilterConfig }
  | { type: 'REMOVE_FILTER'; column: string }
  | { type: 'SET_SEARCH'; term: string }
  | { type: 'SET_PAGE'; page: number }
  | { type: 'SET_PAGE_SIZE'; size: number }
  | { type: 'MOVE_ROW'; fromIndex: number; toIndex: number }
  | { type: 'SET_EDITING'; cell: EditingCell | null }
  | { type: 'STOP_EDITING' }
  | { type: 'TOGGLE_SELECTION'; id: string }
  | { type: 'SELECT_ALL'; ids: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'MARK_CLEAN' }
  | { type: 'REPLACE_IDS'; mapping: Record<string, string> }
  | { type: 'REVERT_ROW'; id: string }
  | { type: 'SET_CELL_ERROR'; rowId: string; columnKey: string; error: string | null }
  | { type: 'MARK_ROWS_DIRTY'; ids: string[] };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function reduceRows<T extends Record<string, unknown>>(
  state: ChildTableState<T>,
  action: Extract<Action<T>, { type: 'ADD_ROW' | 'DELETE_ROWS' | 'UPDATE_CELL' | 'MOVE_ROW' | 'MARK_CLEAN' | 'REPLACE_IDS' | 'REVERT_ROW' | 'SET_CELL_ERROR' | 'MARK_ROWS_DIRTY' }>,
): ChildTableState<T> {
  switch (action.type) {
    case 'ADD_ROW': {
      const rows = [...state.rows];
      const idx = action.index ?? rows.length;
      rows.splice(idx, 0, action.row);
      return { ...state, rows };
    }

    case 'DELETE_ROWS': {
      const idsToDelete = new Set(action.ids);
      const rows = state.rows.filter((r) => !idsToDelete.has(r.id));
      const selectedIds = new Set(state.selectedIds);
      for (const id of action.ids) selectedIds.delete(id);
      return { ...state, rows, selectedIds };
    }

    case 'UPDATE_CELL': {
      const rows = state.rows.map((row) => {
        if (row.id !== action.rowId) return row;
        const originalData = row.originalData ?? { ...row.data };
        return {
          ...row,
          data: { ...row.data, [action.columnKey]: action.value },
          dirty: true,
          originalData,
        };
      });
      return { ...state, rows };
    }

    case 'MOVE_ROW': {
      const rows = [...state.rows];
      const [moved] = rows.splice(action.fromIndex, 1);
      moved?.id && rows.splice(action.toIndex, 0, moved);
      return { ...state, rows };
    }

    case 'MARK_CLEAN': {
      const rows = state.rows.map((row) => ({
        ...row,
        dirty: false,
        originalData: undefined,
      }));
      return { ...state, rows };
    }

    case 'REPLACE_IDS': {
      const rows = state.rows.map((row) => {
        const newId = action.mapping[row.id];
        return newId ? { ...row, id: newId } : row;
      });
      const selectedIds = new Set<string>();
      for (const id of state.selectedIds) {
        selectedIds.add(action.mapping[id] ?? id);
      }
      return { ...state, rows, selectedIds };
    }

    case 'REVERT_ROW': {
      const rows = state.rows.map((row) => {
        if (row.id !== action.id || !row.originalData) return row;
        return {
          ...row,
          data: { ...row.originalData },
          dirty: false,
          originalData: undefined,
          errors: undefined,
        };
      });
      return { ...state, rows };
    }

    case 'SET_CELL_ERROR': {
      const rows = state.rows.map((row) => {
        if (row.id !== action.rowId) return row;
        const errors = { ...row.errors };
        if (action.error) {
          errors[action.columnKey] = action.error;
        } else {
          delete errors[action.columnKey];
        }
        return { ...row, errors: Object.keys(errors).length > 0 ? errors : undefined };
      });
      return { ...state, rows };
    }

    case 'MARK_ROWS_DIRTY': {
      const dirtySet = new Set(action.ids);
      const rows = state.rows.map((row) => {
        if (!dirtySet.has(row.id)) return row;
        return {
          ...row,
          dirty: true,
          originalData: row.originalData ?? { ...row.data },
        };
      });
      return { ...state, rows };
    }
  }
}

function reducer<T extends Record<string, unknown>>(
  state: ChildTableState<T>,
  action: Action<T>,
): ChildTableState<T> {
  switch (action.type) {
    case 'SET_ROWS': {
      const maxPage = Math.max(0, Math.ceil(action.rows.length / Math.max(1, state.pageSize)) - 1);
      return {
        ...state,
        rows: action.rows,
        currentPage: Math.min(state.currentPage, maxPage),
      };
    }

    case 'SET_COLUMNS':
      return { ...state, columns: action.columns };

    case 'ADD_ROW':
    case 'DELETE_ROWS':
    case 'UPDATE_CELL':
    case 'MOVE_ROW':
    case 'MARK_CLEAN':
    case 'REPLACE_IDS':
    case 'REVERT_ROW':
    case 'SET_CELL_ERROR':
    case 'MARK_ROWS_DIRTY':
      return reduceRows(state, action);

    case 'TOGGLE_SORT': {
      let sort: SortConfig | null;
      if (!state.sort || state.sort.column !== action.column) {
        sort = { column: action.column, direction: 'asc' };
      } else if (state.sort.direction === 'asc') {
        sort = { column: action.column, direction: 'desc' };
      } else {
        sort = null;
      }
      return { ...state, sort };
    }

    case 'ADD_FILTER':
      return {
        ...state,
        filters: [
          ...state.filters.filter((f) => f.column !== action.filter.column),
          action.filter,
        ],
        currentPage: 0,
      };

    case 'REMOVE_FILTER':
      return {
        ...state,
        filters: state.filters.filter((f) => f.column !== action.column),
        currentPage: 0,
      };

    case 'SET_SEARCH':
      return { ...state, searchTerm: action.term, currentPage: 0 };

    case 'SET_PAGE':
      return { ...state, currentPage: action.page };

    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.size, currentPage: 0 };

    case 'SET_EDITING':
      return { ...state, editingCell: action.cell };

    case 'STOP_EDITING':
      return { ...state, editingCell: null };

    case 'TOGGLE_SELECTION': {
      const selectedIds = new Set(state.selectedIds);
      if (selectedIds.has(action.id)) {
        selectedIds.delete(action.id);
      } else {
        selectedIds.add(action.id);
      }
      return { ...state, selectedIds };
    }

    case 'SELECT_ALL':
      return { ...state, selectedIds: new Set(action.ids) };

    case 'CLEAR_SELECTION':
      return { ...state, selectedIds: new Set<string>() };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseChildTableStateReturn<T extends Record<string, unknown>> {
  state: ChildTableState<T>;
  dispatch: React.ActionDispatch<[action: Action<T>]>;

  /** Rows after applying search, filters, and sort. */
  displayRows: ChildTableRow<T>[];

  getDirtyRows: () => ChildTableRow<T>[];
  getRow: (id: string) => ChildTableRow<T> | undefined;

  setRows: (rows: ChildTableRow<T>[]) => void;
  addRow: (index?: number) => ChildTableRow<T>;
  deleteRows: (ids: string[]) => void;
  updateCell: (rowId: string, columnKey: string, value: unknown) => void;

  toggleSort: (column: string) => void;
  setSearchTerm: (term: string) => void;
  setPageSize: (size: number) => void;
  setCurrentPage: (page: number) => void;
  moveRow: (fromIndex: number, toIndex: number) => void;

  toggleRowSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;

  startEditing: (rowId: string, columnKey: string) => void;
  stopEditing: () => void;
  cancelEditing: () => void;

  validateCellValue: (columnKey: string, value: unknown, rowData?: unknown) => string | null;
  setCellError: (rowId: string, columnKey: string, error: string | null) => void;

  markAllClean: () => void;
  replaceRowIds: (mapping: Record<string, string>) => void;
  revertRow: (id: string) => void;
  markRowsDirty: (ids: string[]) => void;
}

/**
 * Core state management hook for the ChildTable spreadsheet component.
 *
 * Manages rows, sorting, filtering, search, pagination, selection, and
 * editing state via `useReducer`. Exposes memoised `displayRows` that
 * reflect the current search → filter → sort pipeline and convenience
 * methods for every supported mutation.
 *
 * @param config  - Table configuration (columns, flags, etc.)
 * @param initialData - Optional initial row data
 * @param events  - Optional event callbacks (onSave, onCellChange, …)
 *
 * @example
 * ```tsx
 * const table = useChildTableState(config, data, { onSave });
 * // table.displayRows, table.addRow(), table.updateCell(…), …
 * ```
 */
export function useChildTableState<T extends Record<string, unknown> = Record<string, unknown>>(
  config: ChildTableConfig<T>,
  initialData?: T[],
  events?: ChildTableEvents<T>,
): UseChildTableStateReturn<T> {
  const initialState = useMemo<ChildTableState<T>>(() => {
    const idField = config.idField ?? ('id' as keyof T & string);
    const rows: ChildTableRow<T>[] = (initialData ?? []).map((d) => ({
      id: d[idField] == null ? generateTempId() : safeString(d[idField]),
      data: d,
    }));

    return {
      rows,
      columns: config.columns,
      selectedIds: new Set<string>(),
      sort: null,
      filters: [],
      editingCell: null,
      focusedCell: null,
      searchTerm: '',
      pageSize: 25,
      currentPage: 0,
    };
    // Only compute once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [state, dispatch] = useReducer(reducer<T>, initialState);

  // -- Prop sync: react to external data changes ----------------------------
  const prevDataRef = useRef(initialData);
  useEffect(() => {
    if (initialData === prevDataRef.current) return;
    prevDataRef.current = initialData;

    const idField = config.idField ?? ('id' as keyof T & string);
    const rows: ChildTableRow<T>[] = (initialData ?? []).map((d) => ({
      id: d[idField] == null ? generateTempId() : safeString(d[idField]),
      data: d,
    }));
    dispatch({ type: 'SET_ROWS', rows });
  }, [initialData, config.idField]);

  // -- Prop sync: react to column config changes ----------------------------
  const prevColumnsRef = useRef(config.columns);
  useEffect(() => {
    if (config.columns === prevColumnsRef.current) return;
    prevColumnsRef.current = config.columns;

    dispatch({ type: 'SET_COLUMNS', columns: config.columns });
  }, [config.columns]);

  // Stable ref for events so callbacks don't re-render the world
  const eventsRef = useRef(events);
  eventsRef.current = events;

  // ---------------------------------------------------------------------------
  // Derived: display pipeline (search → filter → sort)
  // ---------------------------------------------------------------------------

  const displayRows = useMemo(() => {
    let rows = state.rows;

    if (state.searchTerm) {
      rows = rows.filter((r) => matchesSearch(r, state.searchTerm, state.columns));
    }

    if (state.filters.length > 0) {
      rows = rows.filter((r) => state.filters.every((f) => matchesFilter(r, f)));
    }

    if (state.sort) {
      const { column, direction } = state.sort;
      rows = [...rows].sort((a, b) =>
        compareValues(a.data[column as keyof T], b.data[column as keyof T], direction),
      );
    }

    return rows;
  }, [state.rows, state.searchTerm, state.filters, state.sort, state.columns]);

  // ---------------------------------------------------------------------------
  // Auto-save debounce
  // ---------------------------------------------------------------------------

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onSave = eventsRef.current?.onSave;
    if (!onSave) return;

    const dirtyRows = state.rows.filter((r) => r.dirty);
    if (dirtyRows.length === 0) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    const delay = config.autoSaveDebounce ?? 1500;
    autoSaveTimerRef.current = setTimeout(() => {
      void onSave(dirtyRows);
    }, delay);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [state.rows, config.autoSaveDebounce]);

  // ---------------------------------------------------------------------------
  // Convenience methods
  // ---------------------------------------------------------------------------

  const getDirtyRows = useCallback(
    () => state.rows.filter((r) => r.dirty),
    [state.rows],
  );

  const getRow = useCallback(
    (id: string) => state.rows.find((r) => r.id === id),
    [state.rows],
  );

  const setRows = useCallback((rows: ChildTableRow<T>[]) => {
    dispatch({ type: 'SET_ROWS', rows });
  }, []);

  const addRow = useCallback(
    (index?: number): ChildTableRow<T> => {
      const row: ChildTableRow<T> = {
        id: generateTempId(),
        data: buildDefaultRowData(config.columns),
        dirty: true,
      };
      dispatch({ type: 'ADD_ROW', row, index });
      eventsRef.current?.onRowAdd?.(row);
      return row;
    },
    [config.columns],
  );

  const deleteRows = useCallback((ids: string[]) => {
    dispatch({ type: 'DELETE_ROWS', ids });
    eventsRef.current?.onRowDelete?.(ids);
  }, []);

  const updateCell = useCallback(
    (rowId: string, columnKey: string, value: unknown) => {
      const row = state.rows.find((r) => r.id === rowId);
      const oldValue = row?.data[columnKey as keyof T];
      dispatch({ type: 'UPDATE_CELL', rowId, columnKey, value });
      eventsRef.current?.onCellChange?.(rowId, columnKey, value, oldValue);
    },
    [state.rows],
  );

  const toggleSort = useCallback((column: string) => {
    dispatch({ type: 'TOGGLE_SORT', column });
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    dispatch({ type: 'SET_SEARCH', term });
    eventsRef.current?.onSearchChange?.(term);
  }, []);

  const setPageSize = useCallback((size: number) => {
    dispatch({ type: 'SET_PAGE_SIZE', size });
    eventsRef.current?.onPageSizeChange?.(size);
  }, []);

  const setCurrentPage = useCallback((page: number) => {
    dispatch({ type: 'SET_PAGE', page });
    eventsRef.current?.onPageChange?.(page);
  }, []);

  const moveRow = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({ type: 'MOVE_ROW', fromIndex, toIndex });
    eventsRef.current?.onRowReorder?.(fromIndex, toIndex);
  }, []);

  const toggleRowSelection = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_SELECTION', id });
  }, []);

  const selectAll = useCallback(() => {
    const ids = displayRows.map((r) => r.id);
    dispatch({ type: 'SELECT_ALL', ids });
    eventsRef.current?.onSelectionChange?.(ids);
  }, [displayRows]);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
    eventsRef.current?.onSelectionChange?.([]);
  }, []);

  const startEditing = useCallback(
    (rowId: string, columnKey: string) => {
      const row = state.rows.find((r) => r.id === rowId);
      if (!row) return;
      const originalValue = row.data[columnKey as keyof T];
      dispatch({ type: 'SET_EDITING', cell: { rowId, columnKey, originalValue } });
    },
    [state.rows],
  );

  const stopEditing = useCallback(() => {
    dispatch({ type: 'STOP_EDITING' });
  }, []);

  const cancelEditing = useCallback(() => {
    dispatch({ type: 'STOP_EDITING' });
  }, []);

  const validateCellValue = useCallback(
    (columnKey: string, value: unknown, rowData?: unknown): string | null => {
      const col = config.columns.find((c) => c.key === columnKey);
      if (!col) return null;
      return validateCell(col.validation, value, rowData);
    },
    [config.columns],
  );

  const setCellError = useCallback(
    (rowId: string, columnKey: string, error: string | null) => {
      dispatch({ type: 'SET_CELL_ERROR', rowId, columnKey, error });
    },
    [],
  );

  const markAllClean = useCallback(() => {
    dispatch({ type: 'MARK_CLEAN' });
  }, []);

  const replaceRowIds = useCallback((mapping: Record<string, string>) => {
    dispatch({ type: 'REPLACE_IDS', mapping });
  }, []);

  const revertRow = useCallback((id: string) => {
    dispatch({ type: 'REVERT_ROW', id });
  }, []);

  const markRowsDirty = useCallback((ids: string[]) => {
    dispatch({ type: 'MARK_ROWS_DIRTY', ids });
  }, []);

  return {
    state,
    dispatch,
    displayRows,
    getDirtyRows,
    getRow,
    setRows,
    addRow,
    deleteRows,
    updateCell,
    toggleSort,
    setSearchTerm,
    setPageSize,
    setCurrentPage,
    moveRow,
    toggleRowSelection,
    selectAll,
    clearSelection,
    startEditing,
    stopEditing,
    cancelEditing,
    validateCellValue,
    setCellError,
    markAllClean,
    replaceRowIds,
    revertRow,
    markRowsDirty,
  };
}
