'use client';

import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  /** Slot for a leading search input or similar control. */
  leading?: ReactNode;
  /** Slot for filter controls (selects, comboboxes). */
  filters?: ReactNode;
  /** Slot for action buttons rendered on the right. */
  actions?: ReactNode;
}

/**
 * A composable toolbar that arranges search, filter, and action controls
 * in a horizontal bar. Stacks vertically on mobile for responsiveness.
 *
 * Rather than prescribing specific child types, Toolbar provides flexible
 * slots that accept any ReactNode — compose with SearchInput, Combobox,
 * Toggle, Button, or any custom control.
 *
 * @example
 * <Toolbar
 *   leading={<SearchInput placeholder="Search..." />}
 *   filters={<Combobox options={departments} placeholder="Department" />}
 *   actions={<Button icon={Plus}>Add</Button>}
 * />
 */
export function Toolbar({ leading, filters, actions, className, children, ...props }: ToolbarProps) {
  return (
    <div
      role="toolbar"
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 rounded border border-border bg-muted/30 transition-colors duration-200',
        className
      )}
      {...props}
    >
      {leading && <div className="shrink-0 w-full sm:w-auto">{leading}</div>}
      {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
      {children}
      {actions && <div className="flex items-center gap-2 sm:ml-auto shrink-0">{actions}</div>}
    </div>
  );
}

export default Toolbar;
