'use client';

import { type HTMLAttributes, type ReactNode, type ElementType, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

type TimelinePosition = 'left' | 'right' | 'alternate';

const TimelineContext = createContext<{ position: TimelinePosition; index: number }>({
  position: 'right',
  index: 0,
});

/* ------------------------------------------------------------------ */
/*  Timeline                                                           */
/* ------------------------------------------------------------------ */

export interface TimelineProps extends HTMLAttributes<HTMLUListElement> {
  /** Content alignment relative to the connector line. */
  position?: TimelinePosition;
}

/**
 * A vertical event timeline for displaying chronological sequences.
 *
 * Supports left-aligned, right-aligned, and alternating layouts
 * matching the CDS-37 Timeline component.
 *
 * @example
 * <Timeline>
 *   <TimelineItem>
 *     <TimelineDot />
 *     <TimelineContent>Step 1</TimelineContent>
 *   </TimelineItem>
 * </Timeline>
 */
export function Timeline({ position = 'right', className, children, ...props }: TimelineProps) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <ul className={cn('flex flex-col', className)} {...props}>
      {items.map((child, i) => (
        <TimelineContext.Provider key={i} value={{ position, index: i }}>
          {child}
        </TimelineContext.Provider>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/*  TimelineItem                                                       */
/* ------------------------------------------------------------------ */

export interface TimelineItemProps extends HTMLAttributes<HTMLLIElement> {}

/**
 * A single entry in a Timeline. Contains a dot, optional connector,
 * and content.
 */
export function TimelineItem({ className, children, ...props }: TimelineItemProps) {
  const { position, index } = useContext(TimelineContext);
  const isAlternate = position === 'alternate';
  const showLeft = position === 'left' || (isAlternate && index % 2 === 1);

  return (
    <li
      className={cn(
        'grid gap-x-3 pb-6 last:pb-0',
        isAlternate
          ? 'grid-cols-[1fr_auto_1fr]'
          : showLeft
            ? 'grid-cols-[1fr_auto] justify-items-end'
            : 'grid-cols-[auto_1fr]',
        className
      )}
      {...props}
    >
      {(isAlternate || showLeft) && (
        <div className={cn(
          'flex items-start pt-0.5',
          showLeft && !isAlternate ? 'justify-end' : '',
          isAlternate && index % 2 === 0 ? 'justify-end' : ''
        )}>
          {/* Opposite content slot filled by TimelineOppositeContent or empty */}
          {extractSlot(children, 'TimelineOppositeContent') ?? <span />}
        </div>
      )}

      <div className="flex flex-col items-center">
        {extractSlot(children, 'TimelineDot') ?? <TimelineDot />}
        {extractSlot(children, 'TimelineConnector') ?? <TimelineConnector />}
      </div>

      <div className={cn('flex items-start pt-0.5', showLeft && !isAlternate ? 'justify-end' : '')}>
        {extractSlot(children, 'TimelineContent')}
      </div>
    </li>
  );
}

function extractSlot(children: ReactNode, displayName: string): ReactNode | null {
  const arr = Array.isArray(children) ? children : [children];
  for (const child of arr) {
    if (child && typeof child === 'object' && 'type' in child) {
      const type = child.type as { displayName?: string };
      if (type.displayName === displayName) return child;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  TimelineDot                                                        */
/* ------------------------------------------------------------------ */

export interface TimelineDotProps extends HTMLAttributes<HTMLSpanElement> {
  /** Optional icon rendered inside the dot. */
  icon?: ElementType;
  /** Semantic color for the dot. */
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  /** Use an outlined ring instead of filled circle. */
  outlined?: boolean;
}

const dotColorMap = {
  primary: { filled: 'bg-primary', outlined: 'border-primary' },
  success: { filled: 'bg-success', outlined: 'border-success' },
  warning: { filled: 'bg-warning', outlined: 'border-warning' },
  danger: { filled: 'bg-destructive', outlined: 'border-destructive' },
  info: { filled: 'bg-info', outlined: 'border-info' },
  muted: { filled: 'bg-muted-foreground', outlined: 'border-muted-foreground' },
} as const;

/**
 * Colored circle marker for a TimelineItem.
 */
export function TimelineDot({ icon: Icon, color = 'muted', outlined, className, ...props }: TimelineDotProps) {
  const colors = dotColorMap[color];
  return (
    <span
      className={cn(
        'flex items-center justify-center shrink-0 rounded-full',
        Icon ? 'h-8 w-8' : 'h-3 w-3 mt-1.5',
        outlined
          ? cn('border-2 bg-background', colors.outlined)
          : cn(colors.filled, Icon && 'text-white'),
        className
      )}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" />}
    </span>
  );
}
TimelineDot.displayName = 'TimelineDot';

/* ------------------------------------------------------------------ */
/*  TimelineConnector                                                  */
/* ------------------------------------------------------------------ */

export interface TimelineConnectorProps extends HTMLAttributes<HTMLSpanElement> {}

/**
 * Vertical line connecting two TimelineItems.
 */
export function TimelineConnector({ className, ...props }: TimelineConnectorProps) {
  return (
    <span
      className={cn('w-px flex-1 min-h-[24px] bg-border', className)}
      {...props}
    />
  );
}
TimelineConnector.displayName = 'TimelineConnector';

/* ------------------------------------------------------------------ */
/*  TimelineContent                                                    */
/* ------------------------------------------------------------------ */

export interface TimelineContentProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * The main content area for a TimelineItem.
 */
export function TimelineContent({ className, children, ...props }: TimelineContentProps) {
  return (
    <div className={cn('text-sm text-foreground pb-2', className)} {...props}>
      {children}
    </div>
  );
}
TimelineContent.displayName = 'TimelineContent';

/* ------------------------------------------------------------------ */
/*  TimelineOppositeContent                                            */
/* ------------------------------------------------------------------ */

export interface TimelineOppositeContentProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * Content displayed on the opposite side of the timeline in
 * alternate layout mode.
 */
export function TimelineOppositeContent({ className, children, ...props }: TimelineOppositeContentProps) {
  return (
    <div className={cn('text-sm text-muted-foreground pb-2', className)} {...props}>
      {children}
    </div>
  );
}
TimelineOppositeContent.displayName = 'TimelineOppositeContent';
