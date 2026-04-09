'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { forwardRef } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends CheckboxPrimitive.CheckboxProps {
  /** Optional text label rendered next to the checkbox. */
  label?: string;
}

/**
 * An accessible checkbox built on Radix UI with OpenGov-aligned focus pattern.
 *
 * @example
 * <Checkbox label="Accept terms" onCheckedChange={setAccepted} />
 *
 * @example
 * <Checkbox checked="indeterminate" />
 */
const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <CheckboxPrimitive.Root
          ref={ref}
          className={cn(
            'peer h-4 w-4 shrink-0 rounded border border-border transition-all duration-300 ease-in-out',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground',
            'data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-primary-foreground',
            className
          )}
          {...props}
        >
          <CheckboxPrimitive.Indicator className="flex items-center justify-center">
            {props.checked === 'indeterminate' ? (
              <Minus className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )}
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        {label && <span className="text-sm text-muted-foreground">{label}</span>}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
export default Checkbox;
