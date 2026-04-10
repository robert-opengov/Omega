'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { forwardRef } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const sizeClasses = {
  sm: { root: 'h-5 w-5', icon: 'h-3 w-3' },
  md: { root: 'h-6 w-6', icon: 'h-4 w-4' },
  lg: { root: 'h-7 w-7', icon: 'h-5 w-5' },
} as const;

export interface CheckboxProps extends CheckboxPrimitive.CheckboxProps {
  label?: string;
  indeterminate?: boolean;
  /** Visual size of the checkbox. @default 'md' */
  size?: 'sm' | 'md' | 'lg';
}

const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, label, indeterminate, checked, size = 'md', ...props }, ref) => {
    const resolvedChecked = indeterminate ? 'indeterminate' : checked;
    const s = sizeClasses[size];

    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <CheckboxPrimitive.Root
          ref={ref}
          checked={resolvedChecked}
          className={cn(
            'peer shrink-0 rounded border border-input-border transition-all duration-200 ease-in-out',
            'hover:bg-action-hover-primary',
            'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground',
            'data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-primary-foreground',
            s.root,
            className
          )}
          {...props}
        >
          <CheckboxPrimitive.Indicator className="flex items-center justify-center">
            {resolvedChecked === 'indeterminate' ? (
              <Minus className={s.icon} />
            ) : (
              <Check className={s.icon} />
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
