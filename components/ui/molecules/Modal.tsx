'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/atoms';
import type { DialogAction } from '@/components/ui/types';
import type { ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  'aria-label'?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'fullscreen';
  className?: string;
  hideCloseButton?: boolean;
  primaryAction?: DialogAction;
  secondaryAction?: DialogAction;
  destructiveAction?: DialogAction;
}

const sizeMap: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  fullscreen: 'w-screen h-screen max-w-none max-h-none',
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  'aria-label': ariaLabel,
  children,
  size = 'md',
  className,
  hideCloseButton,
  primaryAction,
  secondaryAction,
  destructiveAction,
}: ModalProps) {
  const isFullscreen = size === 'fullscreen';
  const hasFooter = primaryAction || secondaryAction || destructiveAction;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-overlay bg-overlay backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          aria-label={!title ? ariaLabel : undefined}
          className={cn(
            'fixed left-1/2 top-1/2 z-overlay -translate-x-1/2 -translate-y-1/2 w-[95vw] flex flex-col bg-card border border-border shadow-overlay',
            'animate-in fade-in-0 zoom-in-95',
            isFullscreen ? 'rounded-none' : 'rounded-xl max-h-[90vh]',
            sizeMap[size],
            className,
          )}
        >
          {title ? (
            <div className="shrink-0 px-6 pt-6 pb-0">
              <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
            </div>
          ) : (
            <Dialog.Title className="sr-only">{ariaLabel || 'Dialog'}</Dialog.Title>
          )}

          {description && (
            <Dialog.Description className={cn('text-sm text-muted-foreground', title ? 'px-6 mt-1' : 'sr-only')}>
              {description}
            </Dialog.Description>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

          {hasFooter && (
            <div className="shrink-0 px-6 py-4 border-t border-border flex items-center gap-2">
              {destructiveAction && (
                <Button variant="danger" onClick={destructiveAction.onClick} className="mr-auto">
                  {destructiveAction.label}
                </Button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                {secondaryAction && (
                  <Button variant="outline" onClick={secondaryAction.onClick}>
                    {secondaryAction.label}
                  </Button>
                )}
                {primaryAction && (
                  <Button variant="primary" onClick={primaryAction.onClick}>
                    {primaryAction.label}
                  </Button>
                )}
              </div>
            </div>
          )}

          {!hideCloseButton && (
            <Dialog.Close
              className="absolute top-4 right-4 p-1 rounded hover:bg-muted text-muted-foreground z-content transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default Modal;
