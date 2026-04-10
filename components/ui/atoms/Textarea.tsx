'use client';

import { forwardRef, useEffect, useRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Error message to display. When provided the textarea renders in an
   * error state with `aria-invalid` set to `true`.
   */
  error?: string;
  /**
   * If true, the textarea grows vertically as the user types to fit its content.
   * @default false
   */
  autoGrow?: boolean;
}

/**
 * A multi-line text input with optional auto-grow behaviour.
 *
 * Aligned with CDS-37 design system: `border-input-border` default,
 * `duration-200` transitions, outline-based focus ring.
 *
 * @example
 * <Textarea placeholder="Write a description..." />
 *
 * @example
 * <Textarea autoGrow error="Description is required" />
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, autoGrow, ...props }, ref) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
      if (autoGrow && innerRef.current) {
        const el = innerRef.current;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      }
    }, [props.value, autoGrow]);

    const errorDescId = error && props.id ? `${props.id}-error` : undefined;
    const describedBy = [props['aria-describedby'], errorDescId].filter(Boolean).join(' ') || undefined;

    return (
      <textarea
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy}
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(
          'w-full px-3 py-2 rounded border border-input-border text-sm transition-all duration-200 ease-in-out bg-background text-foreground min-h-[80px] resize-y focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          error && 'border-destructive focus-visible:outline-destructive',
          className
        )}
        onInput={autoGrow ? (e) => {
          const target = e.currentTarget;
          target.style.height = 'auto';
          target.style.height = `${target.scrollHeight}px`;
        } : undefined}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
export default Textarea;
