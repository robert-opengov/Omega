'use client';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

export interface RadioGroupProps extends ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  /** The radio options to render. */
  items: { value: string; label: string; disabled?: boolean }[];
}

/**
 * An accessible radio group built on Radix UI with OpenGov-aligned focus pattern.
 *
 * @example
 * <RadioGroup
 *   items={[
 *     { value: 'a', label: 'Option A' },
 *     { value: 'b', label: 'Option B' },
 *   ]}
 *   onValueChange={setSelected}
 * />
 */
const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ items, className, ...props }, ref) => {
    return (
      <RadioGroupPrimitive.Root
        ref={ref}
        className={cn('flex flex-col gap-3', className)}
        {...props}
      >
        {items.map((item) => (
          <label key={item.value} className="flex items-center gap-3 cursor-pointer">
            <RadioGroupPrimitive.Item
              value={item.value}
              disabled={item.disabled}
              className={cn(
                'h-4 w-4 rounded-full border border-border transition-all duration-300 ease-in-out',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'data-[state=checked]:border-primary data-[state=checked]:bg-primary'
              )}
            >
              <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
              </RadioGroupPrimitive.Indicator>
            </RadioGroupPrimitive.Item>
            <span className="text-sm text-foreground">{item.label}</span>
          </label>
        ))}
      </RadioGroupPrimitive.Root>
    );
  }
);
RadioGroup.displayName = 'RadioGroup';

export { RadioGroup };
export default RadioGroup;
