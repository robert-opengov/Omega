'use client';

import * as SwitchPrimitive from '@radix-ui/react-switch';
import { forwardRef, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends SwitchPrimitive.SwitchProps {
  label?: ReactNode;
}

const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <SwitchPrimitive.Root
          ref={ref}
          className={cn(
            'peer inline-flex h-8 w-[60px] shrink-0 cursor-pointer items-center rounded-[14px] transition-all duration-200 ease-in-out',
            'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:bg-primary data-[state=unchecked]:bg-switch-track',
            className
          )}
          {...props}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              'pointer-events-none flex items-center justify-center h-6 w-6 rounded-full bg-white border border-input-border ring-0 transition-transform duration-200',
              'shadow-[0px_1px_3px_0px_rgba(19,21,23,0.5)]',
              'data-[state=checked]:translate-x-[30px] data-[state=unchecked]:translate-x-[4px]',
              'data-[state=checked]:border-primary',
            )}
          >
            <Check className="h-3.5 w-3.5 text-primary opacity-0 transition-opacity duration-150 data-[state=checked]:opacity-100 [[data-state=checked]_&]:opacity-100" />
          </SwitchPrimitive.Thumb>
        </SwitchPrimitive.Root>
        {label && <span className="text-sm text-muted-foreground">{label}</span>}
      </label>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
export default Switch;
