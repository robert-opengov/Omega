'use client';

import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Tooltip } from '@/components/ui/atoms';

/* ------------------------------------------------------------------ */
/*  Card root                                                         */
/* ------------------------------------------------------------------ */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** @default 'default' */
  variant?: 'default' | 'outlined' | 'elevated';
}

/**
 * A composable card container with OpenGov-aligned shadow tokens.
 *
 * @example
 * <Card>
 *   <CardHeader><CardTitle>Title</CardTitle></CardHeader>
 *   <CardContent>Body</CardContent>
 * </Card>
 */
export function Card({ variant = 'default', className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-card text-card-foreground',
        variant === 'default' && 'border border-border shadow-above',
        variant === 'outlined' && 'border-2 border-border',
        variant === 'elevated' && 'shadow-medium',
        className
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  CardHeader                                                        */
/* ------------------------------------------------------------------ */

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional top-right action slot (e.g. a button or icon). */
  action?: ReactNode;
}

/**
 * Card header section with optional right-aligned action slot.
 */
export function CardHeader({ action, className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('p-6 pb-0', className)} {...props}>
      {action ? (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">{children}</div>
          <div className="flex-shrink-0">{action}</div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CardTitle                                                          */
/* ------------------------------------------------------------------ */

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** @default 'h3' */
  as?: 'h2' | 'h3' | 'h4';
}

/** Card title rendered as a heading element. */
export function CardTitle({ as: Tag = 'h3', className, ...props }: CardTitleProps) {
  return <Tag className={cn('text-lg font-semibold text-foreground', className)} {...props} />;
}

/* ------------------------------------------------------------------ */
/*  CardSubtitle                                                       */
/* ------------------------------------------------------------------ */

/** Small uppercase subtitle text typically placed below a CardTitle. */
export function CardSubtitle({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-xs font-medium text-muted-foreground mt-0.5 uppercase tracking-wide', className)} {...props} />;
}

/* ------------------------------------------------------------------ */
/*  CardDescription                                                    */
/* ------------------------------------------------------------------ */

/** Muted description paragraph for additional card context. */
export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground mt-1', className)} {...props} />;
}

/* ------------------------------------------------------------------ */
/*  CardInfo                                                           */
/* ------------------------------------------------------------------ */

export interface CardInfoProps {
  /** Tooltip content shown on hover/focus. */
  content: ReactNode;
  className?: string;
}

/** An info-icon button with tooltip, designed for the CardHeader `action` slot. */
export function CardInfo({ content, className }: CardInfoProps) {
  return (
    <Tooltip content={content} side="top">
      <button
        type="button"
        className={cn('p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300 ease-in-out', className)}
        aria-label="More information"
      >
        <Info className="h-4 w-4" />
      </button>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------ */
/*  CardMedia                                                          */
/* ------------------------------------------------------------------ */

export interface CardMediaProps extends HTMLAttributes<HTMLDivElement> {
  /** Image source URL. If omitted, render children (e.g. a map component). */
  src?: string;
  alt?: string;
  /** Aspect ratio class. @default 'aspect-video' */
  aspectRatio?: string;
}

/** A media slot (image/video/map) at the top of a card. */
export function CardMedia({ src, alt, aspectRatio = 'aspect-video', className, children, ...props }: CardMediaProps) {
  return (
    <div className={cn('overflow-hidden rounded-t-xl', aspectRatio, className)} {...props}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt || ''} className="w-full h-full object-cover" />
      ) : (
        children
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CardContent                                                        */
/* ------------------------------------------------------------------ */

/** Main body area of a card. */
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6', className)} {...props} />;
}

/* ------------------------------------------------------------------ */
/*  CardFooter                                                         */
/* ------------------------------------------------------------------ */

/** Bottom section of a card, typically used for action buttons. */
export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0 flex items-center gap-2', className)} {...props} />;
}

export default Card;
