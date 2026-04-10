'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/atoms';
import type { ReactNode } from 'react';

export interface SheetAction {
  label: string;
  onClick: () => void;
}

export interface SheetTab {
  label: string;
  value: string;
}

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  side?: 'left' | 'right' | 'bottom';
  className?: string;
  headerActions?: ReactNode;
  tabs?: SheetTab[];
  selectedTab?: string;
  onTabChange?: (value: string) => void;
  primaryAction?: SheetAction;
  secondaryAction?: SheetAction;
  destructiveAction?: SheetAction;
}

const sideStyles = {
  right: 'inset-y-0 right-0 h-full w-[400px] max-w-[90vw] border-l translate-x-full data-[state=open]:translate-x-0',
  left: 'inset-y-0 left-0 h-full w-[400px] max-w-[90vw] border-r -translate-x-full data-[state=open]:translate-x-0',
  bottom: 'inset-x-0 bottom-0 h-auto max-h-[85vh] border-t translate-y-full data-[state=open]:translate-y-0',
};

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = 'right',
  className,
  headerActions,
  tabs,
  selectedTab,
  onTabChange,
  primaryAction,
  secondaryAction,
  destructiveAction,
}: SheetProps) {
  const hasFooter = primaryAction || secondaryAction || destructiveAction;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-overlay backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          className={cn(
            'fixed z-[var(--z-overlay)] bg-card border-border shadow-overlay transition-transform duration-300 ease-in-out flex flex-col',
            sideStyles[side],
            className,
          )}
        >
          <div className="shrink-0 px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {title ? (
                  <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
                ) : (
                  <VisuallyHidden><Dialog.Title>Panel</Dialog.Title></VisuallyHidden>
                )}
                {description && (
                  <Dialog.Description className="text-sm text-muted-foreground mt-1">{description}</Dialog.Description>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {headerActions}
                <Dialog.Close
                  className="p-1 rounded hover:bg-muted text-muted-foreground transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Dialog.Close>
              </div>
            </div>

            {tabs && tabs.length > 0 && (
              <div className="flex gap-0 mt-4 -mb-4 border-b-0" role="tablist">
                {tabs.map((tab) => (
                  <button
                    key={tab.value}
                    role="tab"
                    aria-selected={selectedTab === tab.value}
                    onClick={() => onTabChange?.(tab.value)}
                    className={cn(
                      'px-4 pb-3 text-sm font-medium transition-colors duration-200 border-b-[4px]',
                      selectedTab === tab.value
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default Sheet;
