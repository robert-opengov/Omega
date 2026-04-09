/**
 * Child Table Core Models
 * Framework-agnostic interfaces for the spreadsheet-like table component.
 */
import type { CellPosition } from './cell.models';

export type ColumnType =
  | 'text'
  | 'number'
  | 'integer'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'file'
  | 'pii'
  | 'user'
  | 'formula'
  | 'attachment';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
  validator?: (value: unknown, row: unknown) => boolean;
}

export interface ChildTableColumn<T = Record<string, unknown>> {
  key: keyof T & string;
  label: string;
  type: ColumnType;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  reorderable?: boolean;
  width?: number;
  minWidth?: number;
  frozen?: boolean;
  selectOptions?: SelectOption[];
  renderer?: string;
  validation?: ValidationRule[];
  ariaLabel?: string;
  isUnique?: boolean;
  fieldName?: string;
}

export interface ChildTableRow<T = Record<string, unknown>> {
  id: string;
  data: T;
  selected?: boolean;
  expanded?: boolean;
  errors?: Record<string, string>;
  dirty?: boolean;
  originalData?: T;
}

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'between'
  | 'isEmpty'
  | 'isNotEmpty';

export interface FilterConfig {
  column: string;
  operator: FilterOperator;
  value: unknown;
}

export interface EditingCell {
  rowId: string;
  columnKey: string;
  originalValue: unknown;
}

export interface ChildTableConfig<T = Record<string, unknown>> {
  columns: ChildTableColumn<T>[];
  data?: T[];
  idField?: keyof T & string;
  selectable?: boolean;
  selectionMode?: 'single' | 'multi';
  editable?: boolean;
  rowReorderable?: boolean;
  columnReorderable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  showRowNumbers?: boolean;
  virtualize?: boolean;
  rowHeight?: number;
  virtualizeThreshold?: number;
  autoSaveDebounce?: number;
  title?: string;
  description?: string;
  emptyMessage?: string;
  loading?: boolean;
  readonly?: boolean;
  showRowActions?: boolean;
  serverSidePagination?: boolean;
  totalRecords?: number;
}

export interface ChildTableState<T = Record<string, unknown>> {
  rows: ChildTableRow<T>[];
  columns: ChildTableColumn<T>[];
  selectedIds: Set<string>;
  sort: SortConfig | null;
  filters: FilterConfig[];
  editingCell: EditingCell | null;
  focusedCell: CellPosition | null;
  searchTerm: string;
  pageSize: number;
  currentPage: number;
}

export interface ChildTableEvents<T = Record<string, unknown>> {
  onCellChange?: (rowId: string, columnKey: string, newValue: unknown, oldValue: unknown) => void;
  onRowAdd?: (row: ChildTableRow<T>) => void;
  onRowDelete?: (rowIds: string[]) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  onSortChange?: (sort: SortConfig | null) => void;
  onFilterChange?: (filters: FilterConfig[]) => void;
  onRowReorder?: (fromIndex: number, toIndex: number) => void;
  onColumnReorder?: (fromIndex: number, toIndex: number) => void;
  onSave?: (rows: ChildTableRow<T>[]) => Promise<void>;
  onValidationError?: (rowId: string, columnKey: string, error: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSearchChange?: (term: string) => void;
}

export type RowActionId =
  | 'cut'
  | 'copy'
  | 'paste'
  | 'moveUp'
  | 'moveDown'
  | 'customMove'
  | 'insertAbove'
  | 'insertBelow'
  | 'clear'
  | 'delete';

export type RowActionItem =
  | { kind: 'title'; label: string }
  | { kind: 'divider' }
  | {
      kind: 'action';
      id: RowActionId;
      label: string;
      disabled?: boolean;
      danger?: boolean;
    };

export const NAVIGATION_KEYS = {
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  SPACE: ' ',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  F2: 'F2',
  DELETE: 'Delete',
  BACKSPACE: 'Backspace',
} as const;

export const KEYBOARD_SHORTCUTS = {
  MOVE_ROW_UP: { key: 'ArrowUp', ctrlKey: true, shiftKey: true },
  MOVE_ROW_DOWN: { key: 'ArrowDown', ctrlKey: true, shiftKey: true },
  SELECT_ALL: { key: 'a', ctrlKey: true },
  COPY: { key: 'c', ctrlKey: true },
  CUT: { key: 'x', ctrlKey: true },
  PASTE: { key: 'v', ctrlKey: true },
  UNDO: { key: 'z', ctrlKey: true },
  REDO: { key: 'z', ctrlKey: true, shiftKey: true },
  SAVE: { key: 's', ctrlKey: true },
  ADD_ROW: { key: 'Insert' },
  DELETE_ROW: { key: 'Delete', ctrlKey: true },
} as const;
