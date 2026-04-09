'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  /** @default 'right' */
  side?: 'left' | 'right' | 'bottom';
  className?: string;
}

const sideStyles = {
  right: 'inset-y-0 right-0 h-full w-[400px] max-w-[90vw] border-l translate-x-full data-[state=open]:translate-x-0',
  left: 'inset-y-0 left-0 h-full w-[400px] max-w-[90vw] border-r -translate-x-full data-[state=open]:translate-x-0',
  bottom: 'inset-x-0 bottom-0 h-auto max-h-[85vh] border-t translate-y-full data-[state=open]:translate-y-0',
};

/**
 * A sliding panel (sheet) that emerges from a screen edge.
 *
 * Uses `bg-overlay` for the backdrop and `shadow-overlay` for the panel,
 * aligned with OpenGov popup DNA.
 *
 * @example
 * <Sheet open={isOpen} onOpenChange={setIsOpen} title="Settings" side="right">
 *   <p>Content</p>
 * </Sheet>
 */
export function Sheet({ open, onOpenChange, title, description, children, side = 'right', className }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-overlay backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          className={cn(
            'fixed z-[var(--z-overlay)] bg-card border-border p-6 shadow-overlay transition-transform duration-300 ease-in-out',
            sideStyles[side],
            className
          )}
        >
          {title ? (
            <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
          ) : (
            <VisuallyHidden><Dialog.Title>Panel</Dialog.Title></VisuallyHidden>
          )}
          {description && <Dialog.Description className="text-sm text-muted-foreground mt-1">{description}</Dialog.Description>}
          <div className="mt-4">{children}</div>
          <Dialog.Close
            className="absolute top-4 right-4 p-1 rounded hover:bg-muted text-muted-foreground transition-all duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default Sheet;
