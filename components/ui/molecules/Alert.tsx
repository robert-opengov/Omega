'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const alertVariants = cva(
  'relative flex items-start gap-3 rounded border p-4',
  {
    variants: {
      variant: {
        info: 'bg-info-light border-info-light-border text-info-text',
        success: 'bg-success-light border-success-light-border text-success-text',
        warning: 'bg-warning-light border-warning-light-border text-warning-text',
        error: 'bg-danger-light border-danger-light-border text-danger-text',
      },
    },
    defaultVariants: { variant: 'info' },
  }
);

const iconMap = { info: Info, success: CheckCircle, warning: AlertTriangle, error: AlertCircle };

export interface AlertProps extends VariantProps<typeof alertVariants> {
  /** Optional bold title above the message body. */
  title?: string;
  children: React.ReactNode;
  /** Show a dismiss button. @default false */
  dismissible?: boolean;
  className?: string;
  onDismiss?: () => void;
}

/**
 * A semantic alert banner following CDS-37 pattern:
 * `*-light` background, `*-light-border` border, `*-text` foreground.
 *
 * @example
 * <Alert variant="success" title="Saved">Your changes have been saved.</Alert>
 *
 * @example
 * <Alert variant="error" dismissible>Something went wrong.</Alert>
 */
export function Alert({ variant = 'info', title, children, dismissible, className, onDismiss }: AlertProps) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  const Icon = iconMap[variant || 'info'];

  return (
    <div className={cn(alertVariants({ variant }), className)} role="alert">
      <Icon className="h-8 w-8 flex-shrink-0" />
      <div className="flex-1">
        {title && <p className="font-semibold mb-1">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
      {dismissible && (
        <button
          onClick={() => { setVisible(false); onDismiss?.(); }}
          aria-label="Dismiss alert"
          className="p-1 rounded hover:bg-dismiss-hover transition-all duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default Alert;
