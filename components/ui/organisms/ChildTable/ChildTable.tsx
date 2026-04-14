'use client';

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import {
  ArrowUp,
  ArrowDown,
  ListFilter,
  Funnel,
  GripVertical,
  MoreVertical,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import type {
  AlertModalConfig,
  ChildTableColumn,
  ChildTableConfig,
  ChildTableRow,
  FilterConfig,
  RowActionId,
  RowActionItem,
  SortConfig,
} from './core/models';
import { normalizeRange } from './core/models';
import {
  buildGridTemplateColumns,
  calcTotalPages,
  slicePageRows,
  calcPaginationStart,
  calcPaginationEnd,
  formatCurrency,
  formatDate,
  formatDatetime,
} from './core/grid-utils';

import {
  useChildTableState,
  useChildTableEditing,
  useChildTableSelection,
  useChildTableClipboard,
  useChildTableKeyboard,
  useChildTableA11y,
  useChildTableDnd,
  useChildTableImport,
} from './hooks';

import {
  TableToolbar,
  TablePagination,
  RowContextMenu,
  ColumnMenu,
  AlertModal,
  CoverStates,
  ImportModal,
  CustomMoveModal,
} from './components';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/molecules/Popover';
import type { TablePaginationHandle, CoverStateType } from './components';

import { EditorHost } from './editors';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ChildTableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  readonly config: ChildTableConfig<T>;
  readonly data?: T[];
  readonly title?: string;
  readonly searchPlaceholder?: string;
  readonly pageSizeOptions?: number[];
  readonly totalRecords?: number;
  readonly className?: string;
  readonly onCellChange?: (rowId: string, columnKey: string, value: unknown, oldValue: unknown) => void;
  readonly onRowAdd?: (row: ChildTableRow<T>) => void;
  readonly onRowDelete?: (rowIds: string[]) => void;
  readonly onSelectionChange?: (selectedIds: string[]) => void;
  readonly onSortChange?: (sort: SortConfig | null) => void;
  readonly onFilterChange?: (filters: FilterConfig[]) => void;
  readonly onRowReorder?: (fromIndex: number, toIndex: number) => void;
  readonly onSave?: (rows: ChildTableRow<T>[]) => Promise<void>;
  readonly onPageChange?: (page: number) => void;
  readonly onPageSizeChange?: (size: number) => void;
  readonly onSearchChange?: (term: string) => void;
  readonly onImportComplete?: (data: unknown[]) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCellValue(value: unknown, type: ChildTableColumn['type']): string {
  if (value == null || value === '') return '\u00a0';
  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'date':
      return formatDate(value);
    case 'datetime':
      return formatDatetime(value);
    case 'checkbox':
      return value ? '✓' : '—';
    case 'multiselect':
      if (Array.isArray(value)) return value.map(String).join(', ');
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    default:
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChildTable<T extends Record<string, unknown> = Record<string, unknown>>({
  config,
  data,
  title,
  pageSizeOptions = [5, 10, 25, 50, 100],
  totalRecords: externalTotalRecords,
  className,
  onCellChange,
  onRowAdd,
  onRowDelete,
  onSelectionChange,
  onSortChange,
  onFilterChange,
  onRowReorder,
  onSave,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onImportComplete,
}: ChildTableProps<T>) {
  const tableRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<TablePaginationHandle>(null);

  const [widthOverrides, setWidthOverrides] = useState<Map<string, number>>(new Map());
  const [hiddenColumns] = useState<Set<string>>(new Set());
  const [alertConfig, setAlertConfig] = useState<AlertModalConfig | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveRowIndex, setMoveRowIndex] = useState(0);
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    rowId: string;
    rowIndex: number;
  } | null>(null);
  const [columnMenu, setColumnMenu] = useState<string | null>(null);
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  const isSelectable = config.selectable !== false;

  // -- Hooks ---------------------------------------------------------------
  const tableState = useChildTableState<T>(config, data, {
    onCellChange,
    onRowAdd,
    onRowDelete,
    onSelectionChange,
    onSortChange,
    onFilterChange,
    onRowReorder,
    onSave,
    onPageChange,
    onPageSizeChange,
    onSearchChange,
  });

  const {
    state,
    displayRows,
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
  } = tableState;

  const visibleColumns = useMemo(
    () => state.columns.filter((c) => !hiddenColumns.has(c.key)),
    [state.columns, hiddenColumns],
  );

  const totalRecords = externalTotalRecords ?? displayRows.length;
  const totalPages = calcTotalPages(totalRecords, state.pageSize);
  const pageRows = config.serverSidePagination
    ? displayRows
    : slicePageRows(displayRows, state.currentPage, state.pageSize);
  const paginationStart = calcPaginationStart(state.currentPage, state.pageSize, totalRecords);
  const paginationEnd = calcPaginationEnd(state.currentPage, state.pageSize, totalRecords);

  const a11y = useChildTableA11y();
  const selection = useChildTableSelection(a11y);
  const editing = useChildTableEditing(tableState, config, pageRows, visibleColumns, tableRef);
  const clipboard = useChildTableClipboard<T>();
  const keyboard = useChildTableKeyboard<T>();
  const dnd = useChildTableDnd(config, moveRow);
  const importHook = useChildTableImport<T>();

  const importing = importHook.importProgress != null
    && importHook.importProgress.phase !== 'complete'
    && importHook.importProgress.phase !== 'error'
    && !importHook.importProgress.cancelled;

  const importPercent = useMemo(() => {
    const p = importHook.importProgress;
    if (!p || p.total === 0) return 0;
    return Math.round((p.current / p.total) * 100);
  }, [importHook.importProgress]);

  const gridTemplate = useMemo(
    () => buildGridTemplateColumns(visibleColumns, widthOverrides, { showRowActions: config.showRowActions }),
    [visibleColumns, widthOverrides, config.showRowActions],
  );

  const isEditable = config.editable !== false;
  const isReadonly = config.readonly === true;
  const allSelected = pageRows.length > 0 && pageRows.every((r) => state.selectedIds.has(r.id));

  const coverState: CoverStateType = useMemo(() => {
    if (config.loading) return 'loading';
    if (importing) return 'importing';
    if (clipboard.pasteErrorLocked) return 'saveBlocked';
    if (displayRows.length === 0 && (state.searchTerm || state.filters.length > 0)) return 'filteredEmpty';
    if (state.rows.length === 0) return 'empty';
    return 'ready';
  }, [config.loading, importing, clipboard.pasteErrorLocked, displayRows.length, state.searchTerm, state.filters.length, state.rows.length]);

  const showAlert = useCallback((titleText: string, message: string, onDismiss?: () => void) => {
    setAlertConfig({
      title: titleText,
      message,
      buttonLabel: 'OK',
      icon: 'warning',
      onDismiss: () => {
        setAlertConfig(null);
        onDismiss?.();
      },
    });
  }, []);

  // -- Toolbar handlers ----------------------------------------------------
  const handleAddRow = useCallback(() => {
    const row = addRow();
    a11y.announceRowAdded(state.rows.length + 1);
    return row;
  }, [addRow, a11y, state.rows.length]);

  const handleDeleteSelected = useCallback(() => {
    const ids = Array.from(state.selectedIds);
    if (ids.length === 0) return;
    deleteRows(ids);
    a11y.announceRowsDeleted(ids.length);
  }, [state.selectedIds, deleteRows, a11y]);

  const handleTemplateDownload = useCallback(() => {
    const headers = visibleColumns.map((c) => c.label).join(',');
    const blob = new Blob([headers], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title ?? 'table'}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [visibleColumns, title]);

  // -- Sort ----------------------------------------------------------------
  const handleSort = useCallback(
    (column: string) => {
      toggleSort(column);
      const col = visibleColumns.find((c) => c.key === column);
      if (col) {
        const currentDir = state.sort?.column === column ? state.sort.direction : null;
        const nextDir: 'asc' | 'desc' = currentDir === 'asc' ? 'desc' : 'asc';
        a11y.announceSort(col.label, nextDir);
      }
    },
    [toggleSort, visibleColumns, state.sort, a11y],
  );

  // -- Editing handlers ----------------------------------------------------
  const handleCellDoubleClick = useCallback(
    (rowId: string, columnKey: string) => {
      if (isReadonly) return;
      editing.startEditing(rowId, columnKey);
    },
    [isReadonly, editing],
  );

  const handleEditorSave = useCallback(
    (value: unknown) => {
      editing.setEditingValue(value);
      requestAnimationFrame(() => {
        editing.saveEdit();
      });
    },
    [editing],
  );

  const handleEditorCancel = useCallback(() => {
    editing.cancelEdit();
  }, [editing]);

  // -- Cell mousedown / selection -------------------------------------------
  const handleCellMouseDown = useCallback(
    (e: ReactMouseEvent, rowIndex: number, colIndex: number) => {
      if (e.button !== 0) return;
      if (state.editingCell) return;
      e.preventDefault();
      selection.onCellMouseDown(e.shiftKey, rowIndex, colIndex);
      keyboard.setFocusedCell({ rowIndex, columnIndex: colIndex });
    },
    [state.editingCell, selection, keyboard],
  );

  const handleCellMouseEnter = useCallback(
    (rowIndex: number, colIndex: number) => {
      selection.onCellMouseEnter(rowIndex, colIndex);
    },
    [selection],
  );

  // -- Row checkbox selection (with Shift+click range) ---------------------
  const lastSelectedRowRef = useRef<number | null>(null);

  const handleRowCheckboxClick = useCallback(
    (e: React.MouseEvent<HTMLInputElement>, rowId: string, rowIndex: number) => {
      if (e.shiftKey && lastSelectedRowRef.current !== null) {
        const start = Math.min(lastSelectedRowRef.current, rowIndex);
        const end = Math.max(lastSelectedRowRef.current, rowIndex);
        for (let i = start; i <= end; i++) {
          const r = pageRows[i];
          if (r && !state.selectedIds.has(r.id)) {
            toggleRowSelection(r.id);
          }
        }
      } else {
        toggleRowSelection(rowId);
      }
      lastSelectedRowRef.current = rowIndex;
    },
    [toggleRowSelection, pageRows, state.selectedIds],
  );

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      clearSelection();
      a11y.announceSelection(0);
    } else {
      selectAll();
      a11y.announceSelection(pageRows.length);
    }
  }, [allSelected, clearSelection, selectAll, pageRows.length, a11y]);

  // -- Column menu ---------------------------------------------------------
  const handleColumnFilter = useCallback(
    (columnKey: string, operator: FilterConfig['operator'], value: unknown) => {
      tableState.dispatch({ type: 'ADD_FILTER', filter: { column: columnKey, operator, value } });
      setColumnMenu(null);
    },
    [tableState],
  );

  const handleClearColumnFilter = useCallback(
    (columnKey: string) => {
      tableState.dispatch({ type: 'REMOVE_FILTER', column: columnKey });
      setColumnMenu(null);
    },
    [tableState],
  );


  // -- Column resize -------------------------------------------------------
  const handleResizeStart = useCallback(
    (columnKey: string, e: ReactMouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setResizingCol(columnKey);
      resizeStartX.current = e.clientX;
      resizeStartWidth.current = widthOverrides.get(columnKey)
        ?? visibleColumns.find((c) => c.key === columnKey)?.width
        ?? 100;

      const onMouseMove = (me: globalThis.MouseEvent) => {
        const delta = me.clientX - resizeStartX.current;
        const newWidth = Math.max(60, resizeStartWidth.current + delta);
        setWidthOverrides((prev) => {
          const next = new Map(prev);
          next.set(columnKey, newWidth);
          return next;
        });
      };

      const onMouseUp = () => {
        setResizingCol(null);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [widthOverrides, visibleColumns],
  );

  // -- Context menu --------------------------------------------------------
  const handleRowContextMenu = useCallback(
    (e: ReactMouseEvent, rowId: string, rowIndex: number) => {
      e.preventDefault();
      setContextMenu({ position: { x: e.clientX, y: e.clientY }, rowId, rowIndex });
    },
    [],
  );

  const handleRowActionsClick = useCallback(
    (e: ReactMouseEvent, rowId: string, rowIndex: number) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setContextMenu({ position: { x: rect.left, y: rect.bottom + 4 }, rowId, rowIndex });
    },
    [],
  );

  const buildContextMenuItems = useCallback(
    (rowIndex: number): RowActionItem[] => {
      const rowNum = state.currentPage * state.pageSize + rowIndex + 1;
      return [
        { kind: 'title', label: `Row ${rowNum}` },
        { kind: 'action', id: 'cut', label: 'Cut', disabled: isReadonly },
        { kind: 'action', id: 'copy', label: 'Copy' },
        { kind: 'action', id: 'paste', label: 'Paste', disabled: isReadonly },
        { kind: 'divider' },
        { kind: 'action', id: 'insertAbove', label: 'Insert 1 Row Above', disabled: isReadonly },
        { kind: 'action', id: 'insertBelow', label: 'Insert 1 Row Below', disabled: isReadonly },
        { kind: 'divider' },
        { kind: 'action', id: 'clear', label: 'Clear Row', disabled: isReadonly },
        { kind: 'action', id: 'delete', label: 'Delete Row', disabled: isReadonly, danger: true },
      ];
    },
    [state.currentPage, state.pageSize, isReadonly],
  );

  const handleContextMenuAction = useCallback(
    (id: RowActionId) => {
      if (!contextMenu) return;
      const { rowId, rowIndex } = contextMenu;

      switch (id) {
        case 'copy':
          clipboard.onCopyAction(pageRows, visibleColumns, displayRows, state.selectedIds, selection.cellRange);
          break;
        case 'cut':
          clipboard.onCutAction(pageRows, visibleColumns, displayRows, state.selectedIds, config, selection.cellRange, {
            setCellValue: updateCell,
          });
          break;
        case 'paste': {
          const anchor = keyboard.focusedCell ?? { rowIndex, columnIndex: 0 };
          navigator.clipboard.readText().then((text) => {
            if (!text) return;
            const dt = new DataTransfer();
            dt.setData('text/plain', text);
            const syntheticEvent = { clipboardData: dt, preventDefault: () => {} } as unknown as ClipboardEvent;
            clipboard.onPasteAction(syntheticEvent, anchor.rowIndex, anchor.columnIndex, pageRows, visibleColumns, config, {
              setCellValue: updateCell,
              showAlert,
            });
          }).catch(() => {
            showAlert('Paste failed', 'Could not read from clipboard. Please use Ctrl+V / ⌘V instead.');
          });
          break;
        }
        case 'moveUp':
          if (rowIndex > 0) moveRow(rowIndex, rowIndex - 1);
          break;
        case 'moveDown':
          if (rowIndex < pageRows.length - 1) moveRow(rowIndex, rowIndex + 1);
          break;
        case 'customMove':
          setMoveRowIndex(rowIndex);
          setMoveModalOpen(true);
          break;
        case 'insertAbove':
          addRow(rowIndex);
          break;
        case 'insertBelow':
          addRow(rowIndex + 1);
          break;
        case 'clear':
          for (const col of visibleColumns) {
            if (col.editable !== false) updateCell(rowId, col.key, null);
          }
          break;
        case 'delete':
          deleteRows([rowId]);
          a11y.announceRowsDeleted(1);
          break;
        default:
          break;
      }
      setContextMenu(null);
    },
    [contextMenu, clipboard, keyboard.focusedCell, pageRows, visibleColumns, displayRows, state.selectedIds, selection.cellRange, config, updateCell, showAlert, moveRow, addRow, deleteRows, a11y],
  );

  const handleCustomMove = useCallback(
    (targetPosition: number) => {
      const target = targetPosition - 1;
      if (target !== moveRowIndex) moveRow(moveRowIndex, target);
      setMoveModalOpen(false);
      a11y.announceRowMoved(moveRowIndex, target);
    },
    [moveRowIndex, moveRow, a11y],
  );

  const importColumns = useMemo(
    () => visibleColumns.map((c) => ({ key: c.key, label: c.label, required: c.validation?.some((v) => v.type === 'required') })),
    [visibleColumns],
  );

  const handleImportComplete = useCallback(
    (rows: Record<string, unknown>[]) => {
      setImportOpen(false);
      onImportComplete?.(rows);
    },
    [onImportComplete],
  );

  // -- Keyboard context ----------------------------------------------------
  const keyboardContext = useMemo(
    () => ({
      visibleRows: pageRows,
      visibleColumns,
      config,
      editingCell: state.editingCell,
      selectedIds: state.selectedIds,
      selectionRange: selection.cellRange,
      startEditing: editing.startEditing,
      commitEditing: editing.saveEdit,
      cancelEditing: editing.cancelEdit,
      setCellValue: updateCell,
      setSelectedIds: (ids: Set<string>) => {
        tableState.dispatch({ type: 'CLEAR_SELECTION' });
        for (const id of ids) tableState.dispatch({ type: 'TOGGLE_SELECTION', id });
      },
      setSelectionRange: (range: import('./core/models').CellRange | null) => {
        selection.setCellRangeDirect(range);
        if (range) selection.announceRangeIfMultiCell();
      },
      toggleRowSelection,
      onSort: handleSort,
      onAddRow: handleAddRow,
      onDeleteSelected: handleDeleteSelected,
      onMoveRow: moveRow,
      onSave: onSave ? () => void onSave(tableState.getDirtyRows()) : undefined,
      tableRef,
    }),
    [pageRows, visibleColumns, config, state.editingCell, state.selectedIds, selection, editing, updateCell, tableState, toggleRowSelection, handleSort, handleAddRow, handleDeleteSelected, moveRow, onSave, displayRows, tableRef],
  );

  // -- Cell selection highlight helper -------------------------------------
  const isCellSelected = useCallback(
    (rowIndex: number, colIndex: number): boolean => {
      if (!selection.cellRange) return false;
      const { minRow, maxRow, minCol, maxCol } = normalizeRange(selection.cellRange);
      return rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol;
    },
    [selection.cellRange],
  );

  // -- Toolbar selection helpers -------------------------------------------
  const selectedRowIndex = useMemo(() => {
    if (state.selectedIds.size !== 1) return -1;
    const selectedId = Array.from(state.selectedIds)[0];
    return pageRows.findIndex((r) => r.id === selectedId);
  }, [state.selectedIds, pageRows]);

  const toolbarCanMoveUp = selectedRowIndex > 0;
  const toolbarCanMoveDown = selectedRowIndex >= 0 && selectedRowIndex < pageRows.length - 1;

  const handleToolbarMoveUp = useCallback(() => {
    if (selectedRowIndex > 0) {
      moveRow(selectedRowIndex, selectedRowIndex - 1);
      a11y.announceRowMoved(selectedRowIndex, selectedRowIndex - 1);
    }
  }, [selectedRowIndex, moveRow, a11y]);

  const handleToolbarMoveDown = useCallback(() => {
    if (selectedRowIndex >= 0 && selectedRowIndex < pageRows.length - 1) {
      moveRow(selectedRowIndex, selectedRowIndex + 1);
      a11y.announceRowMoved(selectedRowIndex, selectedRowIndex + 1);
    }
  }, [selectedRowIndex, pageRows.length, moveRow, a11y]);

  const handleToolbarMoveToPosition = useCallback(
    (targetIndex: number) => {
      if (selectedRowIndex < 0) return;
      if (targetIndex === selectedRowIndex) return;
      const clamped = Math.max(0, Math.min(targetIndex, pageRows.length - 1));
      moveRow(selectedRowIndex, clamped);
      a11y.announceRowMoved(selectedRowIndex, clamped);
    },
    [selectedRowIndex, pageRows.length, moveRow, a11y],
  );

  const handleClearCellValues = useCallback(() => {
    if (config.readonly) return;
    if (selection.cellRange) {
      const { minRow, maxRow, minCol, maxCol } = normalizeRange(selection.cellRange);
      for (let r = minRow; r <= maxRow; r++) {
        const row = pageRows[r];
        if (!row) continue;
        for (let c = minCol; c <= maxCol; c++) {
          const col = visibleColumns[c];
          if (col && col.editable !== false) {
            updateCell(row.id, col.key, null);
          }
        }
      }
    } else if (state.selectedIds.size > 0) {
      for (const id of state.selectedIds) {
        for (const col of visibleColumns) {
          if (col.editable !== false) updateCell(id, col.key, null);
        }
      }
    }
  }, [config.readonly, selection.cellRange, state.selectedIds, pageRows, visibleColumns, updateCell]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Title heading above the table (like reference) */}
      {title && (
        <h3 className="text-sm font-bold text-foreground mb-2">{title}</h3>
      )}

      {/* Skip link for keyboard/screen-reader users */}
      <a
        href="#ct-grid-body"
        className="sr-only focus:not-sr-only focus:absolute focus:z-overlay focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-1 focus:rounded focus:text-sm"
      >
        Skip to table content
      </a>

      <div className="relative rounded-t-lg border border-border bg-background overflow-hidden">
      {/* Toolbar */}
      <TableToolbar
        searchTerm={state.searchTerm}
        onSearchChange={setSearchTerm}
        onImport={() => setImportOpen(true)}
        onTemplateDownload={handleTemplateDownload}
        isEditable={isEditable}
        isReadonly={isReadonly}
        title={title}
        pageSize={state.pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={setPageSize}
        selectedCount={state.selectedIds.size}
        canMoveUp={toolbarCanMoveUp}
        canMoveDown={toolbarCanMoveDown}
        hasCellRange={!!selection.cellRange}
        onMoveUp={handleToolbarMoveUp}
        onMoveDown={handleToolbarMoveDown}
        onMoveToPosition={handleToolbarMoveToPosition}
        onDeleteSelected={handleDeleteSelected}
        onClearSelection={handleClearCellValues}
        totalRows={pageRows.length}
      />

      {/* Grid container */}
      <div
        ref={tableRef}
        role="grid"
        aria-label={title ?? 'Data table'}
        aria-describedby={a11y.instructionsId}
        aria-rowcount={displayRows.length}
        aria-colcount={visibleColumns.length + 2}
        className={cn('overflow-x-auto focus-visible:outline-none', selection.isDragging && 'select-none')}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (a11y.isUndoShortcut(e) && clipboard.pasteErrorLocked) {
            e.preventDefault();
            clipboard.undoBadPaste(updateCell);
            return;
          }
          keyboard.onKeydown(e.nativeEvent, keyboardContext);
        }}
        onCopy={(e) => {
          clipboard.onCopyAction(pageRows, visibleColumns, displayRows, state.selectedIds, selection.cellRange, e.nativeEvent);
        }}
        onCut={(e) => {
          clipboard.onCutAction(pageRows, visibleColumns, displayRows, state.selectedIds, config, selection.cellRange, { setCellValue: updateCell, event: e.nativeEvent });
        }}
        onPaste={(e) => {
          const anchor = keyboard.focusedCell;
          if (!anchor) return;
          void clipboard.onPasteAction(
            e.nativeEvent,
            anchor.rowIndex,
            anchor.columnIndex,
            pageRows,
            visibleColumns,
            config,
            { setCellValue: updateCell, showAlert },
          );
        }}
        onMouseUp={() => { selection.onDocumentMouseUp(); selection.announceRangeIfMultiCell(); }}
      >
        <div
          className="inline-grid min-w-full"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {/* ---- Header row ---- */}
          <div role="row" className="contents">
            {/* Row select header (checkbox) */}
            <div
              role="columnheader"
              className="sticky left-0 z-content flex items-center justify-center h-[50px] bg-muted border-b border-border"
            >
              {isSelectable && (
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  aria-label="Select all rows"
                  className="ct-checkbox cursor-pointer"
                />
              )}
            </div>

            {/* Actions column header */}
            {config.showRowActions !== false && (
              <div
                role="columnheader"
                className="flex items-center px-2 h-[50px] bg-muted border-b border-border text-[13px] font-semibold text-muted-foreground"
              >
                Actions
              </div>
            )}

            {/* Data column headers */}
            {visibleColumns.map((col, i) => {
              const isSorted = state.sort?.column === col.key;
              const sortDir = isSorted ? state.sort!.direction : null;
              const hasFilter = state.filters.some((f) => f.column === col.key);
              let ariaSortValue: 'ascending' | 'descending' | 'none' = 'none';
              if (isSorted && sortDir === 'asc') ariaSortValue = 'ascending';
              else if (isSorted) ariaSortValue = 'descending';

              const isFirstHeader = i === 0;
              const isMenuOpen = columnMenu === col.key;
              let filterBtnColor = 'text-muted-foreground/40';
              if (isMenuOpen) filterBtnColor = 'text-primary bg-primary/10';
              else if (hasFilter) filterBtnColor = 'text-primary';

              return (
                <div
                  key={col.key}
                  role="columnheader"
                  aria-sort={ariaSortValue}
                  data-col-index={i}
                  data-col-key={col.key}
                  tabIndex={0}
                  className={cn(
                    'group relative flex items-center gap-1.5 px-4 h-[50px] text-sm font-semibold text-foreground select-none',
                    'bg-muted border-b border-border',
                    'transition-colors duration-200',
                    !isFirstHeader && 'before:absolute before:left-0 before:top-[20%] before:bottom-[20%] before:w-px before:bg-foreground/[0.08]',
                    col.sortable && 'cursor-pointer hover:bg-foreground/[0.04]',
                    'focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--primary)]',
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  onKeyDown={(e) => {
                    if (col.sortable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleSort(col.key);
                    }
                  }}
                >
                  <span className="truncate">{col.label}</span>

                  {col.sortable && (
                    <button
                      type="button"
                      aria-label={`Sort by ${col.label}`}
                      onClick={(e) => { e.stopPropagation(); handleSort(col.key); }}
                      className={cn(
                        'shrink-0 p-0.5 rounded transition-colors duration-200',
                        isSorted ? 'text-primary' : 'text-muted-foreground/40',
                        'hover:text-foreground hover:bg-muted',
                      )}
                    >
                      {isSorted && sortDir === 'desc'
                        ? <ArrowDown className="h-3.5 w-3.5" />
                        : <ArrowUp className="h-3.5 w-3.5" />}
                    </button>
                  )}

                  <Popover
                    open={columnMenu === col.key}
                    onOpenChange={(open) => setColumnMenu(open ? col.key : null)}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Open column filter options for ${col.label}${hasFilter ? ' (filtered)' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          'shrink-0 p-0.5 rounded transition-colors duration-200',
                          filterBtnColor,
                          !isMenuOpen && 'hover:text-foreground hover:bg-muted',
                          'focus-visible:outline-2 focus-visible:outline-primary',
                        )}
                      >
                        {hasFilter
                          ? <Funnel className="h-3.5 w-3.5" />
                          : <ListFilter className="h-3.5 w-3.5" />}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="bottom"
                      align="start"
                      sideOffset={4}
                      className="w-[280px] p-0 rounded-lg"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      {(() => {
                        const activeFilter = state.filters.find((f) => f.column === col.key);
                        return (
                          <ColumnMenu
                            hasFilter={!!activeFilter}
                            filterValue={activeFilter?.value ?? null}
                            filterOperator={activeFilter?.operator}
                            onFilter={(op, val) => handleColumnFilter(col.key, op, val)}
                            onClearFilter={() => handleClearColumnFilter(col.key)}
                            onClose={() => setColumnMenu(null)}
                          />
                        );
                      })()}
                    </PopoverContent>
                  </Popover>

                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute right-0 top-2 bottom-2 w-0.5 cursor-col-resize rounded-full',
                      'hover:bg-primary/40 transition-colors duration-200',
                      resizingCol === col.key && 'bg-primary/60',
                    )}
                    onMouseDown={(e) => handleResizeStart(col.key, e)}
                  />
                </div>
              );
            })}
          </div>

          {/* ---- Body rows ---- */}
          <span id="ct-grid-body" tabIndex={-1} className="sr-only">Table body</span>
          {pageRows.map((row, rowIndex) => {
            const isRowSelected = state.selectedIds.has(row.id);
            const isDragOver = dnd.dropTargetIndex === rowIndex;
            const isDirty = !!row.dirty;
            const absoluteRowNum = state.currentPage * state.pageSize + rowIndex + 1;

            return (
              <div
                key={row.id}
                role="row"
                tabIndex={-1}
                aria-rowindex={absoluteRowNum + 1}
                aria-selected={isRowSelected}
                className={cn(
                  'contents',
                  isDragOver && '[&>*]:border-t-2 [&>*]:border-t-primary',
                )}
                onContextMenu={(e) => handleRowContextMenu(e, row.id, rowIndex)}
              >
                {/* Row select: drag handle + row number + checkbox */}
                <div
                  role="gridcell"
                  className={cn(
                    'sticky left-0 z-content relative h-[50px] border-b border-border transition-colors duration-200',
                    isRowSelected ? 'bg-primary-light' : 'bg-background',
                  )}
                  onMouseEnter={() => setHoveredRowIndex(rowIndex)}
                  onMouseLeave={() => setHoveredRowIndex(null)}
                >
                  {config.rowReorderable && !isReadonly && (
                    <span
                      {...dnd.getDragHandleProps(rowIndex)}
                      className={cn(
                        'absolute left-0 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-opacity duration-150',
                        hoveredRowIndex === rowIndex ? 'opacity-100' : 'opacity-0',
                      )}
                      aria-label="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>
                  )}
                  <span
                    className={cn(
                      'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm tabular-nums text-muted-foreground transition-all duration-150 select-none',
                      (hoveredRowIndex === rowIndex || isRowSelected) && isSelectable && 'invisible',
                    )}
                    aria-hidden="true"
                  >
                    {absoluteRowNum}
                  </span>
                  {isSelectable && (
                    <input
                      type="checkbox"
                      checked={isRowSelected}
                      onChange={() => {/* controlled via onClick for shiftKey access */}}
                      onClick={(e) => handleRowCheckboxClick(e, row.id, rowIndex)}
                      aria-label={`Select row ${absoluteRowNum}`}
                      className={cn(
                        'ct-checkbox absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150 cursor-pointer',
                        hoveredRowIndex === rowIndex || isRowSelected ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  )}
                </div>

                {/* Actions column: kebab */}
                {config.showRowActions !== false && (
                  <div
                    role="gridcell"
                    className={cn(
                      'flex items-center justify-center h-[50px] border-b border-border transition-colors duration-200',
                      isRowSelected ? 'bg-primary-light' : 'bg-background',
                    )}
                    onMouseEnter={() => setHoveredRowIndex(rowIndex)}
                    onMouseLeave={() => setHoveredRowIndex(null)}
                  >
                    <button
                      type="button"
                      aria-label={`Actions for row ${absoluteRowNum}`}
                      onClick={(e) => handleRowActionsClick(e, row.id, rowIndex)}
                      className="w-7 h-7 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Data cells */}
                {visibleColumns.map((col, colIndex) => {
                  const cellValue = row.data[col.key];
                  const isEditingThis = state.editingCell?.rowId === row.id && state.editingCell?.columnKey === col.key;
                  const isFocused = keyboard.focusedCell?.rowIndex === rowIndex && keyboard.focusedCell?.columnIndex === colIndex;
                  const selected = isCellSelected(rowIndex, colIndex);
                  const hasError = !!row.errors?.[col.key];
                  const isRequired = col.validation?.some((v) => v.type === 'required');
                  const isFirstDataCol = colIndex === 0;

                  // Compute range-edge box-shadow for visible selection borders
                  let rangeShadow: string | undefined;
                  if (selected && !isEditingThis && !hasError) {
                    const shadows: string[] = [];
                    if (selection.isRangeEdge(rowIndex, colIndex, 'top')) shadows.push('inset 0 2px 0 0 var(--primary)');
                    if (selection.isRangeEdge(rowIndex, colIndex, 'bottom')) shadows.push('inset 0 -2px 0 0 var(--primary)');
                    if (selection.isRangeEdge(rowIndex, colIndex, 'left')) shadows.push('inset 2px 0 0 0 var(--primary)');
                    if (selection.isRangeEdge(rowIndex, colIndex, 'right')) shadows.push('inset -2px 0 0 0 var(--primary)');
                    if (shadows.length > 0) rangeShadow = shadows.join(', ');
                  }

                  return (
                    <div
                      key={`${row.id}-${col.key}`}
                      role="gridcell"
                      data-row-id={row.id}
                      data-col-key={col.key}
                      data-row-index={rowIndex}
                      data-col-index={colIndex}
                      tabIndex={isFocused ? 0 : -1}
                      aria-selected={selected ? true : undefined}
                      aria-invalid={hasError ? true : undefined}
                      className={cn(
                        'relative flex items-center px-4 h-[50px] text-sm select-none',
                        selected && !selection.isRangeEdge(rowIndex, colIndex, 'bottom') ? 'border-b border-transparent' : 'border-b border-border',
                        'cursor-default overflow-hidden',
                        !isFirstDataCol && !selected && 'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-foreground/[0.06]',
                        (selected || isRowSelected) && !isEditingThis && 'bg-primary-light',
                        isFocused && !selected && !isEditingThis && 'outline outline-2 outline-primary -outline-offset-2',
                        hasError && 'bg-danger/5 shadow-[inset_0_0_0_2px_var(--danger)]',
                        isDirty && !selected && !isRowSelected && !isFocused && !hasError && 'bg-warning/4',
                        !selected && !isRowSelected && !isFocused && !hasError && !isDirty && 'bg-background',
                        isEditable && !isReadonly && col.editable !== false && col.type !== 'formula' && 'cursor-cell',
                        isEditingThis && 'outline outline-2 outline-primary -outline-offset-2 shadow-[0_0_0_4px_hsl(var(--primary-h)_var(--primary-s)_var(--primary-l)_/_0.15)]',
                      )}
                      style={rangeShadow ? { boxShadow: rangeShadow } : undefined}
                      onMouseDown={(e) => handleCellMouseDown(e, rowIndex, colIndex)}
                      onDoubleClick={() => handleCellDoubleClick(row.id, col.key)}
                      onMouseEnter={() => { handleCellMouseEnter(rowIndex, colIndex); setHoveredRowIndex(rowIndex); }}
                      onMouseLeave={() => setHoveredRowIndex(null)}
                      onContextMenu={(e) => handleRowContextMenu(e, row.id, rowIndex)}
                      onKeyDown={(e) => keyboard.onCellKeydown(e.nativeEvent, row.id, col.key, rowIndex, colIndex, keyboardContext)}
                    >
                      {isEditingThis ? (
                        <EditorHost
                          column={col as ChildTableColumn}
                          value={editing.editingValue}
                          onChange={editing.setEditingValue}
                          onSave={handleEditorSave}
                          onCancel={handleEditorCancel}
                          onTabSave={(evt) => editing.onTabSave(evt.value, evt.shiftKey, colIndex)}
                          rowId={row.id}
                          autoFocus
                        />
                      ) : (
                        <span className={cn('truncate', hasError && 'text-danger')}>
                          {formatCellValue(cellValue, col.type)}
                        </span>
                      )}

                      {hasError && row.errors && (
                        <span
                          className="absolute bottom-0.5 left-1 right-1 text-[9px] text-danger truncate leading-tight"
                          title={row.errors[col.key]}
                        >
                          {row.errors[col.key]}
                        </span>
                      )}

                      {isRequired && (cellValue == null || cellValue === '') && (
                        <span className="absolute right-2 top-2 text-danger text-xs font-bold pointer-events-none" aria-hidden="true">*</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Add row button at bottom */}
          {isEditable && !isReadonly && pageRows.length > 0 && (
            <div className="contents">
              <div
                className="flex items-center px-4 py-2 bg-background"
                style={{ gridColumn: `1 / -1` }}
              >
                <button
                  type="button"
                  onClick={handleAddRow}
                  aria-label="Add new row"
                  className="w-10 h-8 inline-flex items-center justify-center rounded border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <TablePagination
        ref={paginationRef}
        currentPage={state.currentPage}
        totalPages={totalPages}
        pageSize={state.pageSize}
        paginationStart={paginationStart}
        paginationEnd={paginationEnd}
        totalRecords={totalRecords}
        onPageChange={setCurrentPage}
        selectedCount={state.selectedIds.size}
        onDeleteSelected={isEditable && !isReadonly ? handleDeleteSelected : undefined}
      />

      {/* Cover states overlay */}
      {coverState !== 'ready' && (
        <CoverStates
          coverState={coverState}
          emptyMessage={config.emptyMessage}
          onAddRow={isEditable && !isReadonly ? handleAddRow : undefined}
          onClearFilters={() => {
            state.filters.forEach((f) =>
              tableState.dispatch({ type: 'REMOVE_FILTER', column: f.column }),
            );
            setSearchTerm('');
          }}
          importProgress={importPercent}
          onCancelImport={importHook.cancelImport}
          isEditable={isEditable && !isReadonly}
        />
      )}

      {/* A11y live regions (polite + assertive) and keyboard instructions */}
      <div ref={a11y.liveRegionRef} />
      <div ref={a11y.assertiveRegionRef} />
      <div ref={a11y.instructionsRef} />

      {/* Context menu */}
      {contextMenu && (
        <RowContextMenu
          items={buildContextMenuItems(contextMenu.rowIndex)}
          position={contextMenu.position}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}


      {/* Alert modal */}
      <AlertModal config={alertConfig} />

      {/* Import modal */}
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onComplete={handleImportComplete}
        columns={importColumns}
        parseFile={importHook.parseCSV}
        validateRows={importHook.validateImportData}
        mapHeaders={importHook.mapColumnsToFields}
        importProgress={importHook.importProgress}
        onCancelImport={importHook.cancelImport}
        tableColumns={visibleColumns as import('./core/models').ChildTableColumn[]}
      />

      {/* Custom move modal */}
      <CustomMoveModal
        open={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        onSubmit={handleCustomMove}
        currentPosition={moveRowIndex + 1}
        totalRows={pageRows.length}
      />
      </div>
    </div>
  );
}

export default ChildTable;
