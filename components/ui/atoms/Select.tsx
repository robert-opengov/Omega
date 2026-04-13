'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  /** Visual size controlling height. @default 'md' */
  selectSize?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-6 px-2 text-sm',
  md: 'h-8 px-3 text-sm',
  lg: 'h-10 px-4 text-base',
} as const;

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, disabled, id, selectSize = 'md', ...props }, ref) => {
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
          'w-full rounded border border-input-border transition-all duration-75 ease-in-out appearance-none bg-background text-foreground',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:border-ring',
          sizeClasses[selectSize],
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
