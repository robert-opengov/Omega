'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  /** Visual size controlling height. @default 'md' */
  inputSize?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-6 px-2 text-sm',
  md: 'h-8 px-3 text-sm',
  lg: 'h-10 px-4 text-base',
} as const;

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, disabled, id, inputSize = 'md', ...props }, ref) => {
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
          'w-full rounded border border-input-border transition-all duration-75 ease-in-out bg-background text-foreground',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:border-ring',
          sizeClasses[inputSize],
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
