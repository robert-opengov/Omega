'use client';

import type { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from '@/components/ui/atoms';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** @default 'Are you sure?' */
  title?: string;
  description?: ReactNode;
  /** @default 'Confirm' */
  confirmLabel?: string;
  /** @default 'Cancel' */
  cancelLabel?: string;
  /** @default 'default' */
  variant?: 'danger' | 'default' | 'primary';
  loading?: boolean;
  /** Label shown on the confirm button while loading. @default 'Processing...' */
  loadingLabel?: ReactNode;
  onConfirm: () => void;
}

/**
 * A pre-built confirmation dialog built on top of {@link Modal}.
 *
 * @example
 * <ConfirmDialog
 *   open={show}
 *   onOpenChange={setShow}
 *   variant="danger"
 *   description="This action cannot be undone."
 *   onConfirm={handleDelete}
 * />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  loadingLabel = 'Processing...',
  onConfirm,
}: ConfirmDialogProps) {
  const isDanger = variant === 'danger';

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} size="sm" hideCloseButton>
      <div className="flex flex-col gap-4">
        {description && (
          <div className="flex items-start gap-3">
            {isDanger && (
              <div className="shrink-0 mt-0.5 p-2 rounded-full bg-danger-light">
                <AlertTriangle className="w-4 h-4 text-danger" />
              </div>
            )}
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        )}
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="outline"
            size="md"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            size="md"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? loadingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
