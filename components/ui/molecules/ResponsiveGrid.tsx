'use client';

import { type ElementType, type ReactNode, useId, useMemo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const gridGapVariants = cva('grid', {
  variants: {
    gap: {
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
    },
  },
  defaultVariants: { gap: 'md' },
});

export interface ResponsiveGridColumns {
  default?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

export type ResponsiveGridProps = VariantProps<typeof gridGapVariants> & {
  children: ReactNode;
  columns?: ResponsiveGridColumns;
  as?: ElementType;
  className?: string;
  maxWidth?: string;
};

const BREAKPOINTS: Record<string, string> = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
};

/**
 * Responsive CSS grid that accepts column counts per breakpoint.
 * Generates inline CSS with media queries for precise control.
 *
 * @example
 * <ResponsiveGrid columns={{ default: 1, sm: 2, lg: 3 }} gap="lg">
 *   <Card>...</Card>
 *   <Card>...</Card>
 *   <Card>...</Card>
 * </ResponsiveGrid>
 */
export function ResponsiveGrid({
  children,
  columns = { default: 1, sm: 2, lg: 3 },
  gap,
  as: Tag = 'div',
  className,
  maxWidth,
}: ResponsiveGridProps) {
  const reactId = useId();
  const styleId = useMemo(() => `rg-${reactId.replace(/:/g, '')}`, [reactId]);

  const cssText = useMemo(() => {
    const rules: string[] = [];
    if (columns.default) {
      rules.push(`.${styleId}{grid-template-columns:repeat(${columns.default},minmax(0,1fr))}`);
    }
    for (const [bp, minW] of Object.entries(BREAKPOINTS)) {
      const cols = columns[bp as keyof ResponsiveGridColumns];
      if (cols) {
        rules.push(`@media(min-width:${minW}){.${styleId}{grid-template-columns:repeat(${cols},minmax(0,1fr))}}`);
      }
    }
    return rules.join('');
  }, [columns, styleId]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssText }} />
      <Tag
        className={cn(gridGapVariants({ gap }), styleId, maxWidth && 'mx-auto', className)}
        style={maxWidth ? { maxWidth } : undefined}
      >
        {children}
      </Tag>
    </>
  );
}

export default ResponsiveGrid;
