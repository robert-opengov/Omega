'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CustomMoveModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (targetPosition: number) => void;
  currentPosition: number;
  totalRows: number;
}

export function CustomMoveModal({ open, onClose, onSubmit, currentPosition, totalRows }: CustomMoveModalProps) {
  const [target, setTarget] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setTarget(String(currentPosition));
      setError(null);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [open, currentPosition]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, input, [tabindex]:not([tabindex="-1"])',
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
  }, [open]);

  const validate = (val: string): string | null => {
    const num = Number(val);
    if (!val || Number.isNaN(num) || !Number.isInteger(num)) return 'Enter a whole number';
    if (num < 1 || num > totalRows) return `Must be between 1 and ${totalRows}`;
    return null;
  };

  const handleSubmit = () => {
    const err = validate(target);
    if (err) {
      setError(err);
      return;
    }
    onSubmit(Number(target));
  };

  if (!open || !mounted) return null;

  const content = (
    <div className="fixed inset-0 z-overlay">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm animate-in fade-in-0" onClick={onClose} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Move row to position"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm rounded-xl bg-card border border-border shadow-overlay animate-in fade-in-0 zoom-in-95"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Move Row</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Currently at position <span className="font-semibold text-foreground">{currentPosition}</span> of {totalRows}.
          </p>

          <div>
            <label htmlFor="move-target" className="block text-sm font-medium text-foreground mb-1">
              Target position
            </label>
            <input
              ref={inputRef}
              id="move-target"
              type="number"
              min={1}
              max={totalRows}
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? 'move-target-error' : undefined}
              className={cn(
                'w-full h-9 px-3 rounded border text-sm bg-background text-foreground transition-all duration-300 ease-in-out',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                error ? 'border-destructive bg-destructive/5' : 'border-border',
              )}
            />
            {error && (
              <p id="move-target-error" className="text-xs text-destructive mt-1">{error}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 text-sm font-medium rounded border border-border bg-background text-foreground hover:bg-muted transition-all duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="h-8 px-4 text-sm font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98]"
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

export default CustomMoveModal;
