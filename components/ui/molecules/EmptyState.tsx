'use client';

import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/atoms';
import type { ElementType, ReactNode } from 'react';

const statusStyles = {
  empty: { bg: 'bg-muted', icon: 'text-muted-foreground' },
  error: { bg: 'bg-danger-light', icon: 'text-danger-text' },
  success: { bg: 'bg-success-light', icon: 'text-success-text' },
  info: { bg: 'bg-info-light', icon: 'text-info-text' },
} as const;

export interface ResultAction {
  label: string;
  onClick: () => void;
  variant?: ButtonProps['variant'];
}

export interface EmptyStateProps {
  /** Large icon displayed above the title. */
  icon?: ElementType;
  title: string;
  /** @alias subTitle — description text below the title. */
  description?: string;
  /** Alias for description, matching OpenGov Result API. */
  subTitle?: string;
  /** Semantic status that tints the icon background. @default 'empty' */
  status?: 'empty' | 'error' | 'success' | 'info';
  /** Optional custom illustration node (e.g. SVG) rendered instead of the icon circle. */
  illustration?: ReactNode;
  /** Single action button (backward compatible). */
  action?: { label: string; onClick: () => void };
  /** Multiple action buttons — takes precedence over `action`. */
  actions?: ResultAction[];
  className?: string;
}

/**
 * A centered placeholder for empty, error, success, and informational states.
 *
 * Backward compatible — existing `action` prop still works. The `status`
 * prop tints the icon background to match the semantic intent, aligning
 * with OpenGov's Result component pattern.
 *
 * @example
 * <EmptyState icon={InboxIcon} title="No messages" description="You're all caught up!" />
 *
 * @example
 * <EmptyState
 *   status="error"
 *   icon={AlertTriangle}
 *   title="Something went wrong"
 *   subTitle="Please try again later."
 *   actions={[{ label: 'Retry', onClick: retry }, { label: 'Go Back', onClick: goBack, variant: 'outline' }]}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  subTitle,
  status = 'empty',
  illustration,
  action,
  actions,
  className,
}: EmptyStateProps) {
  const desc = subTitle ?? description;
  const styles = statusStyles[status];
  const allActions = actions ?? (action ? [{ label: action.label, onClick: action.onClick }] : []);

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {illustration ? (
        <div className="mb-4" aria-hidden="true">{illustration}</div>
      ) : Icon ? (
        <div className={cn('mb-4 flex h-16 w-16 items-center justify-center rounded-full', styles.bg)} aria-hidden="true">
          <Icon className={cn('h-8 w-8', styles.icon)} />
        </div>
      ) : null}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {desc && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{desc}</p>}
      {allActions.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          {allActions.map((a, i) => (
            <Button key={i} variant={a.variant ?? (i === 0 ? 'primary' : 'outline')} onClick={a.onClick}>
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Alias matching OpenGov's Result component API. */
export const Result = EmptyState;

export default EmptyState;
