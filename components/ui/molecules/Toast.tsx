'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast, type ToastVariant } from '@/providers/toast-provider';

const iconMap: Record<ToastVariant, typeof Info> = { info: Info, success: CheckCircle, warning: AlertTriangle, error: AlertCircle };
const colorMap: Record<ToastVariant, string> = {
  info: 'border-info-light-border bg-info-light text-info-text',
  success: 'border-success-light-border bg-success-light text-success-text',
  warning: 'border-warning-light-border bg-warning-light text-warning-text',
  error: 'border-danger-light-border bg-danger-light text-danger-text',
};

/**
 * Individual toast notification item with OpenGov banner DNA colours and
 * cold-shadow overlay token.
 */
function ToastItem({ id, message, variant, duration }: { id: string; message: string; variant: ToastVariant; duration?: number }) {
  const { removeToast } = useToast();
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!duration || duration <= 0) return;
    const exitDelay = duration - 300;
    const exitTimer = setTimeout(() => setExiting(true), Math.max(exitDelay, 0));
    return () => clearTimeout(exitTimer);
  }, [duration]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => removeToast(id), 300);
  };

  const Icon = iconMap[variant];
  const isUrgent = variant === 'error' || variant === 'warning';

  return (
    <div
      role={isUrgent ? 'alert' : 'status'}
      aria-live={isUrgent ? 'assertive' : 'polite'}
      className={cn(
        'flex items-start gap-3 rounded border p-4 shadow-overlay transition-all duration-300',
        exiting ? 'animate-toastOut' : 'animate-toastIn',
        colorMap[variant],
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={handleDismiss}
        aria-label="Close notification"
        className="p-0.5 rounded hover:bg-dismiss-hover transition-all duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/**
 * Fixed-position toast container anchored to the top-right of the viewport.
 * Renders all active toasts from the toast provider.
 */
export function ToastContainer() {
  const { toasts } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[var(--z-overlay)] flex flex-col gap-2 w-96 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
}

export default ToastContainer;
