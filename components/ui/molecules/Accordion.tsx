'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef } from 'react';

/** Radix Accordion root — single or multiple expansion modes. */
export const Accordion = AccordionPrimitive.Root;

/**
 * A single collapsible item inside an Accordion.
 *
 * @example
 * <AccordionItem value="faq-1">
 *   <AccordionTrigger>Question</AccordionTrigger>
 *   <AccordionContent>Answer</AccordionContent>
 * </AccordionItem>
 */
export function AccordionItem({ className, ...props }: ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item className={cn('border-b border-border', className)} {...props} />;
}

/** Clickable header that toggles the accordion item open/closed. */
export function AccordionTrigger({ className, children, ...props }: ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger
        className={cn(
          'flex w-full items-center justify-between py-4 text-sm font-medium text-foreground hover:text-foreground/80 transition-all duration-300 ease-in-out',
          '[&[data-state=open]>svg]:rotate-180',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-in-out" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

/** Animated collapsible content panel of an accordion item. */
export function AccordionContent({ className, children, ...props }: ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className={cn('overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down', className)}
      {...props}
    >
      <div className="pb-4 text-muted-foreground">{children}</div>
    </AccordionPrimitive.Content>
  );
}

export default Accordion;
