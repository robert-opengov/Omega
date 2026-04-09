'use client';

import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

type HeadingColor = 'foreground' | 'muted' | 'primary' | 'destructive' | 'inherit';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** The HTML heading element to render. @default 'h1' */
  as?: HeadingLevel;
  /** Semantic text color. @default 'foreground' */
  color?: HeadingColor;
}

/**
 * Size map aligned with OpenGov Capital Design System `header.scss`.
 *
 * | Level | Size  | Weight  |
 * |-------|-------|---------|
 * | h1    | 2rem  | bold    |
 * | h2    | 1.75rem | bold |
 * | h3    | 1.5rem | medium |
 * | h4    | 1rem  | medium  |
 * | h5    | 0.875rem | medium |
 * | h6    | 0.75rem | medium |
 */
const sizeMap: Record<HeadingLevel, string> = {
  h1: 'text-[2rem] font-bold',
  h2: 'text-[1.75rem] font-bold',
  h3: 'text-[1.5rem] font-medium',
  h4: 'text-base font-medium',
  h5: 'text-sm font-medium',
  h6: 'text-xs font-medium',
};

const colorMap: Record<HeadingColor, string> = {
  foreground: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  destructive: 'text-destructive',
  inherit: 'text-inherit',
};

/**
 * Semantic heading component with OpenGov-aligned typography scale.
 *
 * Uses `leading-tight` (line-height 1.25) and weight hierarchy where
 * h1/h2 are bold (700) and h3-h6 are medium (500), matching the
 * Capital Design System `cds-header` pattern.
 *
 * @example
 * <Heading as="h1">Dashboard</Heading>
 *
 * @example
 * <Heading as="h3" color="muted">Section Title</Heading>
 */
export function Heading({ as = 'h1', color = 'foreground', className, ...props }: HeadingProps) {
  const Tag = as;
  return <Tag className={cn('leading-tight', colorMap[color], sizeMap[as], className)} {...props} />;
}

export default Heading;
