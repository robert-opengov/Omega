'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Check } from 'lucide-react';
import type { CellEditorProps } from './index';
import { cn } from '@/lib/utils';

function toBool(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val === 'true' || val === '1';
  return Boolean(val);
}

export function CheckboxEditor({
  value,
  onSave,
  onCancel,
  autoFocus = true,
}: CellEditorProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const checked = toBool(value);

  useEffect(() => {
    if (autoFocus) buttonRef.current?.focus();
  }, [autoFocus]);

  const toggle = useCallback(() => {
    onSave(!checked);
  }, [checked, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [toggle, onCancel],
  );

  return (
    <button
      ref={buttonRef}
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label="Toggle checkbox"
      className={cn(
        'flex h-8 w-full items-center justify-center',
        'transition-colors duration-300',
        'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-0',
        'rounded-[var(--radius)]',
      )}
      onClick={toggle}
      onKeyDown={handleKeyDown}
    >
      <span
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded-sm border-2 transition-colors duration-150',
          checked
            ? 'border-primary bg-primary'
            : 'border-border bg-background',
        )}
      >
        {checked && <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />}
      </span>
    </button>
  );
}
