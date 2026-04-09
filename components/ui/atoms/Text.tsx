'use client';

import { type HTMLAttributes, type ElementType } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textVariants = cva('', {
  variants: {
    size: { xs: 'text-xs', sm: 'text-sm', base: 'text-base', lg: 'text-lg', xl: 'text-xl' },
    weight: { normal: 'font-normal', medium: 'font-medium', semibold: 'font-semibold', bold: 'font-bold' },
    color: {
      foreground: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      destructive: 'text-destructive',
      inherit: 'text-inherit',
    },
  },
  defaultVariants: { size: 'base', weight: 'normal', color: 'muted' },
});

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, 'color'>, VariantProps<typeof textVariants> {
  /** The HTML element to render. @default 'p' */
  as?: ElementType;
}

/**
 * Polymorphic text component with size, weight, and semantic color variants.
 *
 * @example
 * <Text size="sm" color="muted">Helper text</Text>
 *
 * @example
 * <Text as="span" weight="bold" color="primary">Highlighted</Text>
 */
export function Text({ as: Tag = 'p', size, weight, color, className, ...props }: TextProps) {
  return <Tag className={cn(textVariants({ size, weight, color }), className)} {...props} />;
}

export default Text;
