'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef } from 'react';

/** Radix Tabs root — wraps TabsList + TabsContent. */
export const Tabs = TabsPrimitive.Root;

/**
 * Horizontal tab list container with a muted background pill.
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
      className={cn('inline-flex items-center gap-1 rounded-lg bg-muted p-1', className)}
      {...props}
    />
  );
}

/**
 * Individual tab trigger. Uses `shadow-above` on the active tab for
 * subtle depth aligned with OpenGov tab DNA.
 */
export function TabsTrigger({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center justify-center rounded px-3 py-1.5 text-sm font-medium transition-all duration-300 ease-in-out',
        'text-muted-foreground hover:text-foreground',
        'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-above',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
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
