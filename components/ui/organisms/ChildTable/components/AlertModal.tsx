'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AlertModalConfig } from '../core/models';

export interface AlertModalProps {
  config: AlertModalConfig | null;
}

export function AlertModal({ config }: AlertModalProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const dismissBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (config) {
      previousFocus.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => dismissBtnRef.current?.focus());
    } else if (previousFocus.current) {
      previousFocus.current.focus();
      previousFocus.current = null;
    }
  }, [config]);

  // Focus trap
  useEffect(() => {
    if (!config || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [config]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && config) {
        config.onDismiss();
      }
    },
    [config],
  );

  useEffect(() => {
    if (!config) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [config, handleKeyDown]);

  if (!config || !mounted) return null;

  const IconComponent = config.icon === 'warning' ? AlertTriangle : Info;
  const isWarning = config.icon === 'warning';

  const content = (
    <div className="fixed inset-0 z-[var(--z-overlay,60)]">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm animate-in fade-in-0" />

      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        aria-describedby="alert-modal-desc"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md rounded-xl bg-card border border-border shadow-overlay animate-in fade-in-0 zoom-in-95"
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'shrink-0 flex items-center justify-center h-10 w-10 rounded-full',
                isWarning ? 'bg-destructive/10' : 'bg-primary/10',
              )}
            >
              <IconComponent
                className={cn('h-5 w-5', isWarning ? 'text-destructive' : 'text-primary')}
              />
            </div>
            <div className="min-w-0 pt-0.5">
              <h2 id="alert-modal-title" className="text-base font-semibold text-foreground">
                {config.title}
              </h2>
              <p id="alert-modal-desc" className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {config.message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 pb-5">
          <button
            ref={dismissBtnRef}
            type="button"
            onClick={config.onDismiss}
            className={cn(
              'h-9 px-5 text-sm font-medium rounded transition-all duration-300 ease-in-out active:scale-[0.98]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              isWarning
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
          >
            {config.buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

export default AlertModal;
