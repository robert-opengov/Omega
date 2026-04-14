'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  /** The trigger element. */
  children: ReactNode;
  /** Content displayed inside the tooltip. */
  content: ReactNode;
  /** @default 'top' */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay in ms before showing the tooltip. @default 200 */
  delayDuration?: number;
  className?: string;
}

/**
 * A tooltip powered by Radix UI that appears on hover/focus.
 *
 * Uses `shadow-soft` (CDS-37 cold shadow) instead of generic `shadow-md`.
 *
 * @example
 * <Tooltip content="Save changes">
 *   <Button>Save</Button>
 * </Tooltip>
 */
export function Tooltip({ children, content, side = 'top', delayDuration = 200, className }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={4}
            className={cn(
              'z-tooltip overflow-hidden rounded bg-black p-2 min-h-[26px] text-xs text-white shadow-soft',
              'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              className
            )}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export default Tooltip;
