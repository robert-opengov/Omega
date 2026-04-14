'use client';

import { cn } from '@/lib/utils';
import { Label, Input } from '@/components/ui/atoms';
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** The text label for the input field. */
  label: ReactNode;
  /** Error message to display below the input. */
  error?: ReactNode;
  /** Helper text shown below the input when there is no error. */
  hint?: ReactNode;
  /** If true, an asterisk will be shown next to the label. @default false */
  required?: boolean;
}

/**
 * A composite component that wraps an {@link Input} with a {@link Label},
 * error message, and hint text. Automatically handles `id`, `htmlFor`, and
 * `aria-describedby` linking for accessibility.
 *
 * @example
 * <FormField label="Email" type="email" placeholder="john@example.com" />
 *
 * @example
 * <FormField label="Password" type="password" required error="Too short" />
 */
export function FormField({ label, error, hint, required, id, className, ...inputProps }: FormFieldProps) {
  const fieldId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : 'field');
  const errorId = error ? `${fieldId}-error` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={fieldId} required={required}>{label}</Label>
      <Input id={fieldId} error={typeof error === 'string' ? error : error ? ' ' : undefined} aria-describedby={describedBy} {...inputProps} />
      {error && <p id={errorId} className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p id={hintId} className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default FormField;
