'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * A breadcrumb navigation bar with accessible labelling.
 *
 * @example
 * <Breadcrumbs items={[
 *   { label: 'Home', href: '/' },
 *   { label: 'Settings', href: '/settings' },
 *   { label: 'Profile' },
 * ]} />
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm', className)}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />}
          {item.href && i < items.length - 1 ? (
            <Link href={item.href} className="text-muted-foreground hover:text-foreground transition-all duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded">{item.label}</Link>
          ) : (
            <span className={i === items.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'} aria-current={i === items.length - 1 ? 'page' : undefined}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export default Breadcrumbs;
