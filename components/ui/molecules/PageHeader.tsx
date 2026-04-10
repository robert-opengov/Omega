'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

export interface BreadcrumbEntry {
  title: string;
  href?: string;
}

export interface PageHeaderStat {
  label: string;
  value: string;
  icon?: 'up' | 'down' | 'flat';
}

export interface PageHeaderStatus {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbEntry[];
  stats?: PageHeaderStat[];
  status?: PageHeaderStatus[];
  titleSize?: 'large' | 'small';
  condensed?: boolean;
  className?: string;
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
} as const;

const statusVariantStyles: Record<string, string> = {
  default: 'bg-secondary text-text-primary',
  success: 'bg-success-light text-success-text',
  warning: 'bg-warning-light text-warning-text',
  danger: 'bg-danger-light text-danger-text',
  info: 'bg-info-light text-info-text',
};

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  stats,
  status,
  titleSize = 'large',
  condensed = false,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn(condensed ? 'py-2' : 'py-4', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden="true" className="text-border">/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-foreground transition-colors duration-200">
                    {crumb.title}
                  </Link>
                ) : (
                  <span className="text-foreground">{crumb.title}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1
              className={cn(
                'font-bold text-foreground leading-tight',
                titleSize === 'large' ? 'text-[1.75rem]' : 'text-xl',
              )}
            >
              {title}
            </h1>
            {status?.map((s, i) => (
              <span
                key={i}
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  statusVariantStyles[s.variant ?? 'default'],
                )}
              >
                {s.label}
              </span>
            ))}
          </div>
          {description && (
            <p className={cn('text-sm text-muted-foreground', condensed ? 'mt-0.5' : 'mt-1')}>
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {stats && stats.length > 0 && (
        <div className={cn('flex items-center gap-6 flex-wrap', condensed ? 'mt-2' : 'mt-4')}>
          {stats.map((stat, i) => {
            const TrendIcon = stat.icon ? trendIcons[stat.icon] : null;
            return (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">{stat.label}:</span>
                <span className="text-sm font-semibold text-foreground">{stat.value}</span>
                {TrendIcon && (
                  <TrendIcon
                    className={cn(
                      'h-3.5 w-3.5',
                      stat.icon === 'up' && 'text-success-text',
                      stat.icon === 'down' && 'text-danger-text',
                      stat.icon === 'flat' && 'text-muted-foreground',
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
