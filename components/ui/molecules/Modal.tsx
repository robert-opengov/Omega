'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Visible title. If omitted, provide `aria-label` for accessibility. */
  title?: string;
  description?: string;
  'aria-label'?: string;
  children: ReactNode;
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  hideCloseButton?: boolean;
}

const sizeMap = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl', '3xl': 'max-w-3xl' };

/**
 * An accessible modal dialog built on Radix UI.
 *
 * Uses `bg-overlay` for the backdrop and `shadow-overlay` for the panel,
 * aligned with the OpenGov popup DNA pattern.
 *
 * @example
 * <Modal open={isOpen} onOpenChange={setIsOpen} title="Confirm">
 *   Are you sure?
 * </Modal>
 */
export function Modal({ open, onOpenChange, title, description, 'aria-label': ariaLabel, children, size = 'md', className, hideCloseButton }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-overlay backdrop-blur-sm animate-in fade-in-0" />
        <Dialog.Content
          aria-label={!title ? ariaLabel : undefined}
          className={cn(
            'fixed left-1/2 top-1/2 z-[var(--z-overlay)] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-h-[90vh] flex flex-col rounded-xl bg-card border border-border shadow-overlay',
            'animate-in fade-in-0 zoom-in-95',
            sizeMap[size],
            className
          )}
        >
          {title ? (
            <div className="shrink-0 px-6 pt-6 pb-0">
              <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-muted-foreground mt-1">{description}</Dialog.Description>
              )}
            </div>
          ) : (
            <Dialog.Title className="sr-only">{ariaLabel || 'Dialog'}</Dialog.Title>
          )}
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
          {!hideCloseButton && (
            <Dialog.Close
              className="absolute top-4 right-4 p-1 rounded hover:bg-muted text-muted-foreground z-10 transition-all duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
