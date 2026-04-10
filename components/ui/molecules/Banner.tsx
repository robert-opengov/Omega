'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/atoms';
import { Info, CheckCircle, AlertTriangle, XCircle, Bell, X } from 'lucide-react';
import type { ReactNode } from 'react';

type BannerVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';

export interface BannerProps {
  variant?: BannerVariant;
  title?: string;
  children?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: { label: string; onClick: () => void };
  className?: string;
}

const variantStyles: Record<BannerVariant, { bg: string; border: string; icon: string }> = {
  info: { bg: 'bg-info-light', border: 'border-l-info', icon: 'text-info-text' },
  success: { bg: 'bg-success-light', border: 'border-l-success', icon: 'text-success-text' },
  warning: { bg: 'bg-warning-light', border: 'border-l-warning', icon: 'text-warning-text' },
  error: { bg: 'bg-danger-light', border: 'border-l-danger', icon: 'text-danger-text' },
  neutral: { bg: 'bg-secondary', border: 'border-l-border', icon: 'text-text-secondary' },
};

const variantIcons: Record<BannerVariant, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  neutral: Bell,
};

export function Banner({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  action,
  className,
}: Readonly<BannerProps>) {
  const [dismissed, setDismissed] = useState(false);
  const styles = variantStyles[variant];
  const Icon = variantIcons[variant];

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <output
      className={cn(
        'w-full border-l-4 rounded-r px-4 py-3 flex items-start gap-3',
        styles.bg,
        styles.border,
        className,
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', styles.icon)} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
        {children && <div className="text-sm text-foreground/80 mt-0.5">{children}</div>}
      </div>
      {action && (
        <Button variant="ghost" size="sm" onClick={action.onClick} className="shrink-0">
          {action.label}
        </Button>
      )}
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-foreground/60 transition-colors duration-200 shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </output>
  );
}

export default Banner;
