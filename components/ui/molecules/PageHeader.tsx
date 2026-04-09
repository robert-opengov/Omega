'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned action slot (e.g. buttons). */
  actions?: ReactNode;
  className?: string;
}

/**
 * A responsive page header with title, description, and optional action slot.
 *
 * @example
 * <PageHeader title="Settings" description="Manage your account." actions={<Button>Save</Button>} />
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4', className)}>
      <div>
        <h1 className="text-[1.75rem] font-bold text-foreground leading-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export default PageHeader;
