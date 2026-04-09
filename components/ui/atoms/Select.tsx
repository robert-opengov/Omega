'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /**
   * Error message to display. When provided the select renders in an
   * error state with `aria-invalid` set to `true`.
   */
  error?: string;
}

/**
 * A native `<select>` component with built-in error state styling and
 * accessibility. Aligned with OpenGov Capital Design System focus and
 * transition patterns.
 *
 * @example
 * <Select>
 *   <option value="1">Option 1</option>
 *   <option value="2">Option 2</option>
 * </Select>
 *
 * @example
 * <Select error="Please select an option">
 *   <option value="">Select...</option>
 * </Select>
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, disabled, id, ...props }, ref) => {
    const errorDescId = error && id ? `${id}-error` : undefined;
    const describedBy = [props['aria-describedby'], errorDescId].filter(Boolean).join(' ') || undefined;

    return (
      <select
        ref={ref}
        id={id}
        disabled={disabled}
        aria-invalid={!!error || undefined}
        {...props}
        aria-describedby={describedBy}
        className={cn(
          'w-full px-3 py-2 rounded border border-border text-sm transition-all duration-300 ease-in-out appearance-none bg-background text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          error && 'border-destructive focus-visible:outline-destructive',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      />
    );
  }
);
Select.displayName = 'Select';

export { Select };
export default Select;
