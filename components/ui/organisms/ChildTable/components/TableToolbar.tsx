'use client';

import { type ChangeEvent, useState } from 'react';
import {
  Search,
  Upload,
  Download,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eraser,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TableToolbarProps {
  readonly searchTerm: string;
  readonly onSearchChange: (value: string) => void;
  readonly onImport: () => void;
  readonly onTemplateDownload?: () => void;
  readonly showTemplateButton?: boolean;
  readonly isEditable: boolean;
  readonly isReadonly: boolean;
  readonly title?: string;
  readonly pageSize?: number;
  readonly pageSizeOptions?: number[];
  readonly onPageSizeChange?: (size: number) => void;

  readonly selectedCount?: number;
  readonly canMoveUp?: boolean;
  readonly canMoveDown?: boolean;
  readonly hasCellRange?: boolean;
  readonly onMoveUp?: () => void;
  readonly onMoveDown?: () => void;
  readonly onMoveToPosition?: (position: number) => void;
  readonly onDeleteSelected?: () => void;
  readonly onClearSelection?: () => void;
  readonly totalRows?: number;
}

const toolbarBtnClass = cn(
  'inline-flex items-center justify-center h-6 w-6 rounded border border-border bg-background transition-colors duration-150',
  'text-muted-foreground hover:bg-muted hover:text-foreground',
  'focus:outline-none focus:border-primary',
  'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:text-muted-foreground',
);

export function TableToolbar(props: TableToolbarProps) {
  const {
    searchTerm,
    onSearchChange,
    onImport,
    onTemplateDownload,
    showTemplateButton = false,
    isEditable,
    isReadonly,
    title,
    pageSize,
    pageSizeOptions,
    onPageSizeChange,
    selectedCount = 0,
    canMoveUp = false,
    canMoveDown = false,
    hasCellRange = false,
    onMoveUp,
    onMoveDown,
    onMoveToPosition,
    onDeleteSelected,
    onClearSelection,
    totalRows = 0,
  } = props;

  const [moveToTarget, setMoveToTarget] = useState('');

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const editable = isEditable && !isReadonly;
  const singleSelected = selectedCount === 1;

  const handleMoveSubmit = () => {
    const pos = Number(moveToTarget);
    if (pos >= 1 && pos <= totalRows && onMoveToPosition) {
      onMoveToPosition(pos - 1);
      setMoveToTarget('');
    }
  };

  return (
    <div
      className="flex items-center flex-wrap gap-x-3 gap-y-2 px-4 py-2 bg-background border-b border-border"
      role="toolbar"
      aria-label={title ? `${title} toolbar` : 'Table toolbar'}
    >
      <span className="text-[13px] text-muted-foreground shrink-0">Search</span>
        <div className="relative w-[180px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
          <input
            type="search"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Find a record"
            aria-label="Search table"
            className="w-full h-8 pl-7 pr-2 text-[13px] rounded border border-border bg-background text-foreground placeholder:text-muted-foreground/60 transition-colors duration-200 focus:outline-none focus:border-primary"
          />
        </div>

        {pageSize != null && pageSizeOptions && onPageSizeChange && (
          <>
            <span className="text-[13px] text-muted-foreground shrink-0">Show rows</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-8 pl-2.5 pr-7 text-[13px] rounded border border-border bg-background text-foreground appearance-none cursor-pointer transition-colors duration-200 focus:outline-none focus:border-primary"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            </div>
          </>
        )}

        {/* Selection controls -- visible when rows are selected */}
        {selectedCount > 0 && editable && (
          <>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!singleSelected || !canMoveDown}
              aria-label="Move selected row down"
              title="Move down"
              className={toolbarBtnClass}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!singleSelected || !canMoveUp}
              aria-label="Move selected row up"
              title="Move up"
              className={toolbarBtnClass}
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>

            {onMoveToPosition && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={totalRows}
                  value={moveToTarget}
                  onChange={(e) => setMoveToTarget(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleMoveSubmit(); }}
                  aria-label="Move to row number"
                  disabled={!singleSelected}
                  className="w-10 h-6 px-1.5 text-xs text-center rounded border border-border bg-background text-foreground tabular-nums focus:outline-none focus:border-primary disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={handleMoveSubmit}
                  disabled={!singleSelected || !moveToTarget}
                  aria-label="Move row"
                  className={cn(
                    'h-6 px-2.5 text-xs font-medium rounded transition-colors duration-150',
                    'bg-primary text-primary-foreground hover:bg-primary/90',
                    'focus:outline-none focus:ring-2 focus:ring-primary/30',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                  )}
                >
                  Move
                </button>
              </div>
            )}

            {onDeleteSelected && (
              <button
                type="button"
                onClick={onDeleteSelected}
                aria-label="Delete selected rows"
                title="Delete selected"
                className={toolbarBtnClass}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}

            <span className="flex items-center gap-1 text-xs shrink-0" aria-live="polite">
              <span className="font-medium text-foreground tabular-nums">{selectedCount}</span>
              <span className="text-muted-foreground">Selected</span>
            </span>
          </>
        )}

        {/* Clear: visible when selection or cell range active */}
        {(selectedCount > 0 || hasCellRange) && editable && onClearSelection && (
          <button
            type="button"
            onClick={onClearSelection}
            aria-label="Clear cell values in selection"
            title="Clear selection"
            className={cn(
              'inline-flex items-center gap-1 h-6 px-2 text-xs rounded border border-border bg-background transition-colors duration-150',
              'text-muted-foreground hover:bg-muted hover:text-foreground',
              'focus:outline-none focus:border-primary',
            )}
          >
            <Eraser className="h-3 w-3" />
            Clear
          </button>
        )}

      {/* Import (+ optional Template) -- in the same flex flow so it wraps naturally */}
      {editable && (
        <button
          type="button"
          onClick={onImport}
          aria-label="Import data"
          className={cn(
            'inline-flex items-center gap-1.5 h-8 px-3 text-[13px] rounded border border-border transition-colors duration-200',
            'bg-background text-foreground hover:bg-muted',
            'focus:outline-none focus:border-primary',
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          Import
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      )}

      {showTemplateButton && onTemplateDownload && (
        <button
          type="button"
          onClick={onTemplateDownload}
          aria-label="Download template"
          className={cn(
            'inline-flex items-center gap-1.5 h-8 px-3 text-sm rounded border border-border transition-colors duration-200',
            'bg-background text-foreground hover:bg-muted',
            'focus:outline-none focus:border-primary',
          )}
        >
          <Download className="h-3.5 w-3.5" />
          Template
        </button>
      )}
    </div>
  );
}

export default TableToolbar;
