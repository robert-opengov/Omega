'use client';

import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/atoms';
import { CheckCircle, AlertTriangle, XCircle, Info, Inbox } from 'lucide-react';
import type { ElementType, ReactNode } from 'react';

type Status = 'empty' | 'error' | 'success' | 'warning' | 'info';
type Size = 'small' | 'medium' | 'large' | 'xlarge';

const statusStyles: Record<Status, { bg: string; icon: string }> = {
  empty: { bg: 'bg-muted', icon: 'text-muted-foreground' },
  error: { bg: 'bg-danger-light', icon: 'text-danger-text' },
  success: { bg: 'bg-success-light', icon: 'text-success-text' },
  warning: { bg: 'bg-warning-light', icon: 'text-warning-text' },
  info: { bg: 'bg-info-light', icon: 'text-info-text' },
};

const defaultIcons: Record<Status, ElementType> = {
  empty: Inbox,
  error: XCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
};

const sizeConfig: Record<Size, { container: string; iconBox: string; iconSize: string; title: string; desc: string }> = {
  small: { container: 'py-6', iconBox: 'h-10 w-10', iconSize: 'h-5 w-5', title: 'text-sm', desc: 'text-xs' },
  medium: { container: 'py-12', iconBox: 'h-16 w-16', iconSize: 'h-8 w-8', title: 'text-lg', desc: 'text-sm' },
  large: { container: 'py-16', iconBox: 'h-20 w-20', iconSize: 'h-10 w-10', title: 'text-xl', desc: 'text-base' },
  xlarge: { container: 'py-20', iconBox: 'h-24 w-24', iconSize: 'h-12 w-12', title: 'text-2xl', desc: 'text-lg' },
};

export interface ResultAction {
  label: string;
  onClick: () => void;
  variant?: ButtonProps['variant'];
}

export interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description?: string;
  subTitle?: string;
  status?: Status;
  size?: Size;
  illustration?: ReactNode;
  action?: { label: string; onClick: () => void };
  actions?: ResultAction[];
  placeholderContainer?: boolean;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  subTitle,
  status = 'empty',
  size = 'medium',
  illustration,
  action,
  actions,
  placeholderContainer = false,
  className,
}: Readonly<EmptyStateProps>) {
  const desc = subTitle ?? description;
  const styles = statusStyles[status];
  const sizing = sizeConfig[size];
  const Icon = icon ?? defaultIcons[status];
  const allActions = actions ?? (action ? [{ label: action.label, onClick: action.onClick }] : []);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizing.container,
        placeholderContainer && 'border-2 border-dashed border-border rounded-lg bg-muted/30',
        className,
      )}
    >
      {illustration ? (
        <div className="mb-4" aria-hidden="true">{illustration}</div>
      ) : (
        <div className={cn('mb-4 flex items-center justify-center rounded-full', sizing.iconBox, styles.bg)} aria-hidden="true">
          <Icon className={cn(sizing.iconSize, styles.icon)} />
        </div>
      )}
      <h3 className={cn('font-semibold text-foreground', sizing.title)}>{title}</h3>
      {desc && <p className={cn('mt-1 text-muted-foreground max-w-sm', sizing.desc)}>{desc}</p>}
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

export const Result = EmptyState;

export default EmptyState;
