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
 * CDS-37 typography scale for headings (DM Sans, SemiBold 600).
 *
 * | Level | Size   | Line Height | Letter Spacing | Weight   |
 * |-------|--------|-------------|----------------|----------|
 * | h1    | 32px   | 1.17        | -0.4px         | semibold |
 * | h2    | 24px   | 1.25        | -0.3px         | semibold |
 * | h3    | 20px   | 1.3         | -0.2px         | semibold |
 * | h4    | 16px   | 1.25        | -0.2px         | semibold |
 * | h5    | 14px   | 1.3         | 0              | semibold |
 * | h6    | 12px   | 1.33        | 0              | semibold |
 */
const sizeMap: Record<HeadingLevel, string> = {
  h1: 'text-[32px] font-semibold leading-[1.17] tracking-[-0.4px]',
  h2: 'text-[24px] font-semibold leading-[1.25] tracking-[-0.3px]',
  h3: 'text-[20px] font-semibold leading-[1.3] tracking-[-0.2px]',
  h4: 'text-[16px] font-semibold leading-[1.25] tracking-[-0.2px]',
  h5: 'text-[14px] font-semibold leading-[1.3]',
  h6: 'text-[12px] font-semibold leading-[1.33]',
};

const colorMap: Record<HeadingColor, string> = {
  foreground: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  destructive: 'text-destructive',
  inherit: 'text-inherit',
};

/**
 * Semantic heading with CDS-37 typography scale (DM Sans SemiBold).
 *
 * @example
 * <Heading as="h1">Dashboard</Heading>
 * <Heading as="h4" color="muted">Section Title</Heading>
 */
export function Heading({ as = 'h1', color = 'foreground', className, ...props }: HeadingProps) {
  const Tag = as;
  return <Tag className={cn(colorMap[color], sizeMap[as], className)} {...props} />;
}

export default Heading;
