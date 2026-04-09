'use client';

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotificationConfig {
  type: 'success' | 'error';
  message: string;
  autoDismissMs?: number;
}

export interface TablePaginationHandle {
  showNotification: (config: NotificationConfig) => void;
  dismissNotification: () => void;
}

export interface TablePaginationProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly pageSize: number;
  readonly paginationStart: number;
  readonly paginationEnd: number;
  readonly totalRecords: number;
  readonly onPageChange: (page: number) => void;
  readonly selectedCount?: number;
  readonly onDeleteSelected?: () => void;
  readonly lastUpdated?: string | null;
  readonly isSaving?: boolean;
}

const TablePaginationInner = forwardRef<TablePaginationHandle, TablePaginationProps>(
  function TablePagination(
    {
      currentPage,
      totalPages,
      pageSize,
      paginationStart,
      paginationEnd,
      totalRecords,
      onPageChange,
      selectedCount = 0,
      onDeleteSelected,
      lastUpdated,
      isSaving,
    },
    ref,
  ) {
    const [notification, setNotification] = useState<NotificationConfig | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

    const dismiss = useCallback(() => {
      setNotification(null);
      if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    const show = useCallback(
      (config: NotificationConfig) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setNotification(config);
        if (config.autoDismissMs) {
          timerRef.current = setTimeout(dismiss, config.autoDismissMs);
        }
      },
      [dismiss],
    );

    useImperativeHandle(ref, () => ({ showNotification: show, dismissNotification: dismiss }), [show, dismiss]);

    const hasPrev = currentPage > 0;
    const hasNext = currentPage < totalPages - 1;

    return (
      <div className="relative">
        {notification && (
          <div
            role="status"
            aria-live="polite"
            className={cn(
              'absolute -top-9 left-0 right-0 flex items-center justify-between gap-2 px-4 py-1.5 text-xs font-medium animate-in slide-in-from-top-2 fade-in-0',
              notification.type === 'success'
                ? 'bg-success/10 text-success border-b border-success/20'
                : 'bg-destructive/10 text-destructive border-b border-destructive/20',
            )}
          >
            <span className="flex items-center gap-1.5">
              {notification.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {notification.message}
            </span>
            <button type="button" onClick={dismiss} aria-label="Dismiss" className="p-0.5 rounded hover:bg-foreground/5">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 bg-background border-x border-b border-border rounded-b-lg text-xs text-muted-foreground">
          {/* Left: Save/Delete + status HUD */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {onDeleteSelected && selectedCount > 0 && (
              <button
                type="button"
                onClick={onDeleteSelected}
                aria-label={`Delete ${selectedCount} selected`}
                className="w-8 h-8 inline-flex items-center justify-center rounded border border-border bg-background text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-150"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}

            {isSaving !== undefined && (
              <span className="text-muted-foreground/60 whitespace-nowrap">
                {isSaving ? 'Saving…' : lastUpdated ? `Saved ${lastUpdated}` : null}
              </span>
            )}
          </div>

          {/* Right: Record count + Page navigation */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="tabular-nums whitespace-nowrap" aria-live="polite">
              {totalRecords > 0
                ? `${paginationStart}–${paginationEnd} of ${totalRecords}`
                : '0 records'}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!hasPrev}
                aria-label="Previous page"
                title="Previous page"
                className={cn(
                  'inline-flex items-center justify-center h-8 w-8 rounded border border-border bg-background transition-colors duration-150',
                  'hover:bg-foreground/[0.04] hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed',
                )}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <span className="tabular-nums whitespace-nowrap px-1" aria-current="page">
                Page <strong className="font-semibold text-foreground">{currentPage + 1}</strong> of <strong className="font-semibold text-foreground">{totalPages || 1}</strong>
              </span>

              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasNext}
                aria-label="Next page"
                title="Next page"
                className={cn(
                  'inline-flex items-center justify-center h-8 w-8 rounded border border-border bg-background transition-colors duration-150',
                  'hover:bg-foreground/[0.04] hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed',
                )}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export { TablePaginationInner as TablePagination };
export default TablePaginationInner;
