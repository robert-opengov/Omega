'use client';

import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef } from 'react';

/** Radix Popover root. */
export const Popover = PopoverPrimitive.Root;
/** Trigger that opens the popover. */
export const PopoverTrigger = PopoverPrimitive.Trigger;

/**
 * Floating popover content panel with CDS-37-aligned `shadow-medium`.
 *
 * @example
 * <Popover>
 *   <PopoverTrigger asChild><Button>Open</Button></PopoverTrigger>
 *   <PopoverContent>Content here</PopoverContent>
 * </Popover>
 */
export function PopoverContent({ className, sideOffset = 4, ...props }: ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-[var(--z-dropdown)] w-72 rounded border border-border bg-card p-4 shadow-medium',
          'animate-in fade-in-0 zoom-in-95',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export default Popover;
