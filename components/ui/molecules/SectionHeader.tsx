'use client';

import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const sectionHeaderVariants = cva('flex items-start justify-between gap-4', {
  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: { size: 'md' },
});

const headingSizeMap = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' } as const;
const descSizeMap = { sm: 'text-[10px]', md: 'text-xs', lg: 'text-sm' } as const;

export interface SectionHeaderProps extends VariantProps<typeof sectionHeaderVariants> {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned action slot (e.g. a Button or Link) */
  action?: ReactNode;
  as?: 'h2' | 'h3' | 'h4';
  className?: string;
}

export function SectionHeader({ title, description, action, as: Tag = 'h3', size, className }: SectionHeaderProps) {
  const resolvedSize = size ?? 'md';
  return (
    <div className={cn(sectionHeaderVariants({ size }), className)}>
      <div className="min-w-0">
        <Tag className={cn('font-semibold tracking-[-0.2px] text-foreground', headingSizeMap[resolvedSize])}>
          {title}
        </Tag>
        {description && (
          <p className={cn('mt-0.5 text-muted-foreground', descSizeMap[resolvedSize])}>{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export default SectionHeader;
