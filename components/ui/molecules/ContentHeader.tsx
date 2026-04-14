'use client';

import type { ReactNode } from 'react';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/molecules/Breadcrumbs';
import { Heading } from '@/components/ui/atoms/Heading';
import { Text } from '@/components/ui/atoms/Text';
import { cn } from '@/lib/utils';

export interface ContentHeaderProps {
  /**
   * Left-aligned navigation actions (e.g. back/refresh IconButtons).
   * Only renders the toolbar row if this or `utilityActions` is provided.
   */
  navActions?: ReactNode;
  /**
   * Right-aligned utility actions (e.g. "Get help" / "Settings" links).
   * Only renders the toolbar row if this or `navActions` is provided.
   */
  utilityActions?: ReactNode;
  /** Breadcrumb trail rendered above the title. Uses the existing Breadcrumbs molecule. */
  breadcrumbs?: BreadcrumbItem[];
  /** Primary heading text — the only required prop. */
  title: ReactNode;
  /** Secondary text below the title (e.g. "Record #123456789"). */
  subtitle?: ReactNode;
  /** Heading scale. `"large"` renders h1 (32 px), `"small"` renders h3 (20 px). @default "large" */
  titleSize?: 'large' | 'small';
  /** Inline content placed beside the title (e.g. status badges). */
  titleActions?: ReactNode;
  /**
   * Slot for a `<Tabs>` / `<TabsList>` rendered at the bottom edge.
   * When provided, bottom padding is removed so the active-tab indicator
   * sits flush with the component's bottom border.
   */
  tabs?: ReactNode;
  className?: string;
}

/**
 * A composable gray-background detail/form page header aligned with CDS-37.
 *
 * Every zone except `title` is optional, so the component scales from a
 * simple gray banner to a full-featured header with nav controls, utility
 * links, breadcrumbs, title + subtitle, and tabs.
 *
 * @example
 * // Minimal
 * <ContentHeader title="Dashboard" />
 *
 * @example
 * // Full
 * <ContentHeader
 *   navActions={<><IconButton icon={ChevronLeft} label="Back" variant="outline" size="sm" /></>}
 *   utilityActions={<UILink href="/help">Get help</UILink>}
 *   breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Forms' }]}
 *   title="{Form Name}"
 *   subtitle="Record #123456789"
 *   tabs={<Tabs defaultValue="overview"><TabsList>...</TabsList></Tabs>}
 * />
 */
export function ContentHeader({
  navActions,
  utilityActions,
  breadcrumbs,
  title,
  subtitle,
  titleSize = 'large',
  titleActions,
  tabs,
  className,
}: ContentHeaderProps) {
  const hasToolbar = !!(navActions || utilityActions);

  return (
    <div
      className={cn(
        'bg-muted w-full',
        tabs ? 'border-b border-border' : '',
        className,
      )}
    >
      <div className={cn('flex flex-col gap-4 px-6', tabs ? 'pt-4' : 'py-4')}>
        {/* Toolbar: nav actions left, utility actions right */}
        {hasToolbar && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">{navActions}</div>
            <div className="flex items-center gap-6">{utilityActions}</div>
          </div>
        )}

        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs items={breadcrumbs} />
        )}

        {/* Title block */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <Heading as={titleSize === 'large' ? 'h1' : 'h3'}>{title}</Heading>
            {titleActions}
          </div>
          {subtitle && (
            <Text size="sm" color="muted" className="tracking-[0.17px]">
              {subtitle}
            </Text>
          )}
        </div>

        {/* Tabs slot */}
        {tabs && <div className="-mb-px">{tabs}</div>}
      </div>
    </div>
  );
}

export default ContentHeader;
