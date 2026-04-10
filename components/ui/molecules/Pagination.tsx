'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/atoms';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  totalItems?: number;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  /** Noun for count display (default 'Item'), auto-pluralized */
  itemLabel?: string;
  /** Show loading skeleton when total is unknown */
  isLoading?: boolean;
}

const focusClasses = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

function pluralize(word: string, count: number): string {
  if (count === 1) return word;
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('ch') || word.endsWith('sh')) return word + 'es';
  return word + 's';
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  totalItems,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  itemLabel = 'Item',
  isLoading = false,
}: Readonly<PaginationProps>) {
  const pages: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      pages.push(i);
    } else if (pages.at(-1) !== '...') {
      pages.push('...');
    }
  }

  const rangeStart = (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems ?? currentPage * pageSize);

  if (isLoading) {
    return (
      <nav className={cn('flex items-center justify-between gap-4', className)} aria-label="Pagination">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-8 w-48 rounded" />
          <Skeleton className="h-8 w-24 rounded" />
        </div>
        <Skeleton className="h-8 w-32 rounded" />
      </nav>
    );
  }

  return (
    <nav className={cn('flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4', className)} aria-label="Pagination">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={cn(
              'inline-flex items-center gap-1 h-8 px-3 text-sm font-medium rounded border transition-colors duration-200',
              currentPage <= 1
                ? 'border-secondary-main/50 text-secondary-main/60 opacity-60 cursor-not-allowed bg-secondary'
                : 'border-secondary-main text-secondary-main hover:bg-action-hover',
              focusClasses,
            )}
          >
            Previous
          </button>

          <div className="hidden sm:inline-flex items-stretch rounded border border-secondary-main/50 overflow-hidden">
            {pages.map((page, i) =>
              page === '...' ? (
                <span
                  key={`dots-${i}`}
                  className="inline-flex items-center justify-center h-8 w-8 text-sm text-text-secondary border-r border-secondary-main/50 last:border-r-0"
                  aria-hidden="true"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  aria-current={page === currentPage ? 'page' : undefined}
                  className={cn(
                    'inline-flex items-center justify-center h-8 min-w-8 px-1.5 text-sm font-medium transition-colors duration-200',
                    'border-r border-secondary-main/50 last:border-r-0',
                    page === currentPage
                      ? 'bg-primary text-primary-foreground'
                      : 'text-text-secondary hover:bg-action-hover',
                    focusClasses,
                  )}
                >
                  {page}
                </button>
              ),
            )}
          </div>

          <span className="sm:hidden text-sm text-text-secondary">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={cn(
              'inline-flex items-center gap-1 h-8 px-3 text-sm font-medium rounded border transition-colors duration-200',
              currentPage >= totalPages
                ? 'border-secondary-main/50 text-secondary-main/60 opacity-60 cursor-not-allowed bg-secondary'
                : 'border-secondary-main text-secondary-main hover:bg-action-hover',
              focusClasses,
            )}
          >
            Next
          </button>
        </div>

        {totalItems != null && (
          <span className="text-sm text-text-secondary tracking-[0.17px]">
            Showing{' '}
            <span className="text-text-primary">{rangeStart}-{rangeEnd}</span>
            {' '}of{' '}
            <span className="text-text-primary">{totalItems}</span>
            {' '}{pluralize(itemLabel, totalItems)}
          </span>
        )}
      </div>

      {onPageSizeChange && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary tracking-[0.17px]">{pluralize(itemLabel, 2)} per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className={cn(
              'h-8 px-3 text-sm font-medium rounded border border-secondary-main text-secondary-main bg-transparent',
              'hover:bg-action-hover transition-colors duration-200',
              focusClasses,
            )}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
    </nav>
  );
}

export default Pagination;
