'use client';

import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** @default 'Are you sure?' */
  title?: string;
  description?: string;
  /** @default 'Confirm' */
  confirmLabel?: string;
  /** @default 'Cancel' */
  cancelLabel?: string;
  /** @default 'default' */
  variant?: 'danger' | 'default' | 'primary';
  loading?: boolean;
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
          <button
            type="button"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="px-3.5 py-2 text-sm font-medium rounded border border-border text-foreground hover:bg-action-hover-primary transition-all duration-200 ease-in-out disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-3.5 py-2 text-sm font-medium rounded transition-all duration-200 ease-in-out disabled:opacity-50 ${
              isDanger
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
