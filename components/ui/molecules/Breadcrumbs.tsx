'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  /** Optional icon to show before label (e.g. Home icon for root) */
  icon?: React.ElementType;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  /** Max items to show before collapsing middle items into "..." */
  maxItems?: number;
}

/**
 * CDS-37 breadcrumbs: chevron-right separator, primary-colored links,
 * with optional collapse for deep navigation hierarchies.
 *
 * @example
 * <Breadcrumbs items={[
 *   { label: 'Home', href: '/', icon: Home },
 *   { label: 'Settings', href: '/settings' },
 *   { label: 'Profile' },
 * ]} />
 */
export function Breadcrumbs({ items, className, maxItems }: BreadcrumbsProps) {
  let visibleItems = items;
  let collapsed = false;

  if (maxItems && maxItems > 2 && items.length > maxItems) {
    visibleItems = [items[0], { label: '...' }, ...items.slice(items.length - (maxItems - 2))];
    collapsed = true;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm tracking-[0.17px]', className)}>
      {visibleItems.map((item, i) => {
        const Icon = item.icon;
        const isLast = i === visibleItems.length - 1;
        const isCollapsedDots = collapsed && i === 1;

        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="h-4 w-4 text-text-secondary mx-1 shrink-0" aria-hidden="true" />
            )}
            {isCollapsedDots ? (
              <span className="inline-flex items-center justify-center h-4 px-1.5 bg-action-hover rounded-sm text-text-secondary text-xs" aria-hidden="true">...</span>
            ) : item.href && !isLast ? (
              <Link
                href={item.href}
                className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded"
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5',
                  isLast ? 'text-text-primary font-medium' : 'text-text-secondary'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
