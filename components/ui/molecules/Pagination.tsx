'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * A page navigation control with first/last shortcuts and ellipsis.
 *
 * @example
 * <Pagination currentPage={page} totalPages={10} onPageChange={setPage} />
 */
export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const pages: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <nav className={cn('flex items-center gap-1', className)} aria-label="Pagination">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} aria-label="Previous page" className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`dots-${i}`} className="px-2 text-muted-foreground" aria-hidden="true">...</span>
        ) : (
          <button key={page} onClick={() => onPageChange(page)} aria-current={page === currentPage ? 'page' : undefined} className={cn('h-8 w-8 rounded text-sm font-medium transition-all duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', page === currentPage ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground')}>
            {page}
          </button>
        )
      )}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} aria-label="Next page" className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

export default Pagination;
