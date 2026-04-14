'use client';

import {
  Plus,
  XCircle,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  RotateCcw,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type CoverStateType =
  | 'ready'
  | 'empty'
  | 'filteredEmpty'
  | 'loading'
  | 'importing'
  | 'saveBlocked'
  | 'error';

export interface CoverStatesProps {
  readonly coverState: CoverStateType;
  readonly emptyMessage?: string;
  readonly errorMessage?: string;
  readonly onAddRow?: () => void;
  readonly onClearFilters?: () => void;
  readonly onRetry?: () => void;
  readonly onDismissError?: () => void;
  readonly importProgress?: number;
  readonly onCancelImport?: () => void;
  readonly isEditable?: boolean;
}

export function CoverStates({
  coverState,
  emptyMessage = 'No data yet',
  errorMessage = 'Something went wrong',
  onAddRow,
  onClearFilters,
  onRetry,
  onDismissError,
  importProgress = 0,
  onCancelImport,
  isEditable,
}: CoverStatesProps) {
  if (coverState === 'ready') return null;

  return (
    <div
      className={cn(
        'flex items-center justify-center z-content animate-in fade-in-0 duration-200',
        coverState === 'empty'
          ? 'relative bg-muted/20 border border-dashed border-border rounded-lg mx-4 my-6'
          : 'absolute inset-0 bg-background/80 backdrop-blur-[2px]',
      )}
      role="status"
      aria-live="polite"
    >
      {/* Empty */}
      {coverState === 'empty' && (
        <div className="flex flex-col items-center gap-3 px-8 py-12 max-w-md text-center">
          <p className="text-sm font-semibold text-foreground">
            {emptyMessage || 'No Child Table yet'}
          </p>
          <p className="text-xs text-muted-foreground">
            {isEditable ? 'Add your first entry or import data to get started.' : 'No records to display.'}
          </p>
          {isEditable && (
            <div className="flex items-center gap-3 mt-2">
              {onAddRow && (
                <button
                  type="button"
                  onClick={onAddRow}
                  className={cn(
                    'inline-flex items-center gap-1.5 h-8 px-4 text-xs font-medium rounded transition-all duration-300',
                    'bg-primary text-primary-foreground hover:bg-primary/90',
                    'focus-visible:outline-2 focus-visible:outline-primary active:scale-[0.98]',
                  )}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Child Table
                </button>
              )}
              <button
                type="button"
                onClick={onAddRow}
                className={cn(
                  'inline-flex items-center gap-1.5 h-8 px-4 text-xs font-medium rounded border border-border transition-all duration-300',
                  'bg-background text-foreground hover:bg-muted',
                  'focus-visible:outline-2 focus-visible:outline-primary active:scale-[0.98]',
                )}
              >
                Import
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filtered Empty */}
      {coverState === 'filteredEmpty' && (
        <div className="flex flex-col items-center gap-4 px-6 py-10 max-w-sm text-center">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted">
            <XCircle className="h-7 w-7 text-muted-foreground/60" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No matching records</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search or filters.
            </p>
          </div>
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className={cn(
                'inline-flex items-center gap-1.5 h-8 px-4 text-xs font-medium rounded border border-border transition-all duration-300 ease-in-out',
                'bg-background text-foreground hover:bg-muted',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98]',
              )}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {coverState === 'loading' && (
        <div className="flex flex-col items-center gap-3 px-6 py-10">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      )}

      {/* Importing */}
      {coverState === 'importing' && (
        <div className="flex flex-col items-center gap-4 px-6 py-10 max-w-xs w-full">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <div className="w-full">
            <div className="relative w-full h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${importProgress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Importing… {importProgress}%
            </p>
          </div>
          {onCancelImport && (
            <button
              type="button"
              onClick={onCancelImport}
              className={cn(
                'inline-flex items-center gap-1.5 h-7 px-3 text-xs font-medium rounded border border-border transition-all duration-300 ease-in-out',
                'bg-background text-foreground hover:bg-muted',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              )}
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {coverState === 'error' && (
        <div className="flex flex-col items-center gap-4 px-6 py-10 max-w-sm text-center">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Error</p>
            <p className="text-xs text-muted-foreground mt-1">{errorMessage}</p>
          </div>
          <div className="flex items-center gap-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className={cn(
                  'inline-flex items-center gap-1.5 h-8 px-4 text-xs font-medium rounded transition-all duration-300 ease-in-out',
                  'bg-primary text-primary-foreground hover:bg-primary/90',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98]',
                )}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry
              </button>
            )}
            {onDismissError && (
              <button
                type="button"
                onClick={onDismissError}
                className={cn(
                  'h-8 px-4 text-xs font-medium rounded border border-border transition-all duration-300 ease-in-out',
                  'bg-background text-foreground hover:bg-muted',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98]',
                )}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {/* Save Blocked */}
      {coverState === 'saveBlocked' && (
        <div className="flex flex-col items-center gap-4 px-6 py-10 max-w-sm text-center">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-warning/10">
            <ShieldAlert className="h-7 w-7 text-warning" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Save Blocked</p>
            <p className="text-xs text-muted-foreground mt-1">
              Paste introduced invalid data. Press{' '}
              <kbd className="inline-block px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono font-semibold">
                {typeof navigator !== 'undefined' && /mac/i.test(navigator.userAgent) ? '⌘' : 'Ctrl'}+Z
              </kbd>{' '}
              to undo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoverStates;
