'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef } from 'react';

/** Radix Tabs root — wraps TabsList + TabsContent. */
export const Tabs = TabsPrimitive.Root;

/**
 * CDS-37 tab list: transparent background with bottom border.
 * Active tab gets a 2px primary underline.
 *
 * @example
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Content 1</TabsContent>
 * </Tabs>
 */
export function TabsList({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn('inline-flex items-center gap-0 border-b border-border', className)}
      {...props}
    />
  );
}

/**
 * CDS-37 tab trigger with bottom-border active indicator.
 * Active state uses a 2px primary-colored bottom border.
 */
export function TabsTrigger({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center justify-center px-2 py-2 text-sm font-semibold transition-all duration-200 ease-in-out',
        'border-b-[4px] border-transparent -mb-px rounded-t',
        'text-text-secondary hover:text-text-primary hover:bg-action-hover-primary',
        'data-[state=active]:text-primary-dark data-[state=active]:border-primary',
        'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring focus-visible:bg-action-hover-primary focus-visible:rounded',
        className
      )}
      {...props}
    />
  );
}

/** Tab content panel. */
export function TabsContent({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('mt-3 focus-visible:outline-none', className)} {...props} />;
}

export default Tabs;
