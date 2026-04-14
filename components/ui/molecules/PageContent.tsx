'use client';

import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const pageContentVariants = cva('w-full', {
  variants: {
    maxWidth: {
      sm: 'max-w-2xl mx-auto',
      md: 'max-w-4xl mx-auto',
      lg: 'max-w-6xl mx-auto',
      xl: 'max-w-7xl mx-auto',
      full: '',
    },
    padding: {
      none: '',
      sm: 'p-4 lg:p-6',
      md: 'p-6 lg:p-8',
      lg: 'p-8 lg:p-10',
    },
    gap: {
      none: '',
      sm: 'space-y-4',
      md: 'space-y-6',
      lg: 'space-y-8',
    },
  },
  defaultVariants: { maxWidth: 'full', padding: 'md', gap: 'md' },
});

export type PageContentProps = VariantProps<typeof pageContentVariants> & {
  children: ReactNode;
  className?: string;
};

/**
 * Standardized page-level wrapper that applies consistent padding, max-width
 * constraints, and vertical spacing for dashboard pages.
 *
 * @example
 * <PageContent maxWidth="lg" gap="lg">
 *   <SectionHeader title="Overview" />
 *   <ResponsiveGrid columns={{ default: 1, sm: 2, lg: 3 }}>
 *     <MetricCard ... />
 *   </ResponsiveGrid>
 * </PageContent>
 */
export function PageContent({ children, maxWidth, padding, gap, className }: PageContentProps) {
  return (
    <div className={cn(pageContentVariants({ maxWidth, padding, gap }), className)}>
      {children}
    </div>
  );
}

export { pageContentVariants };
export default PageContent;
