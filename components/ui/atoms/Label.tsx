'use client';

import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** When true, renders a red asterisk after the label text. */
  required?: boolean;
}

/**
 * A form label with optional required indicator.
 *
 * @example
 * <Label htmlFor="email">Email</Label>
 *
 * @example
 * <Label htmlFor="name" required>Full Name</Label>
 */
const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn('block text-sm font-medium text-foreground mb-1.5', className)}
        {...props}
      >
        {children}
        {required && (
          <>
            <span className="text-destructive ml-1" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </>
        )}
      </label>
    );
  }
);
Label.displayName = 'Label';

export { Label };
export default Label;
