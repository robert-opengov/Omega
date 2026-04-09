'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * Error message to display. When provided the input renders in an
   * error state with `aria-invalid` set to `true`.
   */
  error?: string;
}

/**
 * A standard text input with built-in error state styling and accessibility.
 *
 * Aligned with OpenGov Capital Design System: `border-border` default,
 * `duration-300` transitions, outline-based focus ring.
 *
 * @example
 * <Input placeholder="Enter your name" />
 *
 * @example
 * <Input placeholder="Email" error="Invalid email address" />
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, disabled, id, ...props }, ref) => {
    const errorDescId = error && id ? `${id}-error` : undefined;
    const describedBy = [props['aria-describedby'], errorDescId].filter(Boolean).join(' ') || undefined;

    return (
      <input
        ref={ref}
        id={id}
        disabled={disabled}
        aria-invalid={!!error || undefined}
        {...props}
        aria-describedby={describedBy}
        className={cn(
          'w-full px-3 py-2 rounded border border-border text-sm transition-all duration-300 ease-in-out bg-background text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          error && 'border-destructive bg-destructive/5 focus-visible:outline-destructive',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
export default Input;
