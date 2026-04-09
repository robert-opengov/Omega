'use client';

import * as SwitchPrimitive from '@radix-ui/react-switch';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends SwitchPrimitive.SwitchProps {
  /** Optional text label rendered next to the switch. */
  label?: string;
}

/**
 * A toggle switch built on Radix UI.
 *
 * Uses `bg-background` for the thumb (instead of hardcoded `bg-white`)
 * and `shadow-soft` for correct dark-mode appearance.
 *
 * @example
 * <Switch label="Enable notifications" onCheckedChange={setEnabled} />
 */
const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <SwitchPrimitive.Root
          ref={ref}
          className={cn(
            'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-300 ease-in-out',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted',
            className
          )}
          {...props}
        >
          <SwitchPrimitive.Thumb
            className="pointer-events-none block h-4 w-4 rounded-full bg-background shadow-soft ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
          />
        </SwitchPrimitive.Root>
        {label && <span className="text-sm text-muted-foreground">{label}</span>}
      </label>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
export default Switch;
