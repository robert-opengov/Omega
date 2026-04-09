'use client';

import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef } from 'react';

/** Radix Dropdown root. */
export const DropdownMenu = DropdownPrimitive.Root;
/** Trigger that opens the dropdown. */
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

/**
 * Floating dropdown panel with OpenGov-aligned `shadow-medium`.
 *
 * @example
 * <DropdownMenu>
 *   <DropdownMenuTrigger asChild><Button>Menu</Button></DropdownMenuTrigger>
 *   <DropdownMenuContent>
 *     <DropdownMenuItem>Profile</DropdownMenuItem>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 */
export function DropdownMenuContent({ className, sideOffset = 4, ...props }: ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-[var(--z-dropdown)] min-w-[160px] rounded-xl border border-border bg-card p-1 shadow-medium',
          'animate-in fade-in-0 zoom-in-95',
          className
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

/** A single selectable item inside a dropdown menu. */
export function DropdownMenuItem({ className, ...props }: ComponentPropsWithoutRef<typeof DropdownPrimitive.Item>) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        'relative flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-foreground outline-none',
        'hover:bg-muted focus-visible:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-all duration-300 ease-in-out',
        'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
        className
      )}
      {...props}
    />
  );
}

/** Visual separator between menu items. */
export function DropdownMenuSeparator({ className, ...props }: ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>) {
  return <DropdownPrimitive.Separator className={cn('my-1 h-px bg-border', className)} {...props} />;
}

/** Non-interactive section label inside a dropdown. */
export function DropdownMenuLabel({ className, ...props }: ComponentPropsWithoutRef<typeof DropdownPrimitive.Label>) {
  return <DropdownPrimitive.Label className={cn('px-3 py-1.5 text-xs font-medium text-muted-foreground', className)} {...props} />;
}

export default DropdownMenu;
