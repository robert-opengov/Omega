'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/molecules/Card';
import { Button, Skeleton } from '@/components/ui/atoms';

export interface DashboardWidgetProps {
  title: ReactNode;
  description?: ReactNode;
  action?: { label: string; onClick?: () => void; href?: string };
  loading?: boolean;
  empty?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Standardized card wrapper for dashboard widgets. Provides consistent
 * header layout (title + action), loading skeleton, and empty state.
 */
export function DashboardWidget({
  title,
  description,
  action,
  loading = false,
  empty,
  children,
  className,
}: DashboardWidgetProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {action && (
          action.href ? (
            <a
              href={action.href}
              className="text-sm text-primary hover:underline shrink-0 font-medium"
            >
              {action.label}
            </a>
          ) : (
            <Button variant="outline" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )
        )}
      </CardHeader>
      <CardContent className="flex-1">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : empty && !hasChildren(children) ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            {empty}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function hasChildren(children: ReactNode): boolean {
  if (children === null || children === undefined || children === false) return false;
  if (Array.isArray(children)) return children.some(hasChildren);
  return true;
}

export default DashboardWidget;
