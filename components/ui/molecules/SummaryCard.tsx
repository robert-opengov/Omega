'use client';

import type { ReactNode, ElementType } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/atoms';
import Link from 'next/link';

const summaryCardVariants = cva(
  'flex flex-col items-start gap-2 rounded border border-border bg-card text-left transition-all duration-200 hover:border-primary/40 hover:shadow-soft w-full',
  {
    variants: {
      variant: {
        default: '',
        feature: '',
      },
      size: {
        sm: 'p-3 min-h-[100px]',
        md: 'p-4 min-h-[140px]',
        lg: 'p-5 min-h-[180px]',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

const titleSizeMap = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' } as const;

export interface SummaryCardProps extends VariantProps<typeof summaryCardVariants> {
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  footer?: ReactNode;
  icon?: ElementType;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function SummaryCard({ title, description, badge, footer, icon: Icon, href, onClick, variant, size, className }: SummaryCardProps) {
  const resolvedSize = size ?? 'md';
  const isFeature = variant === 'feature';
  const isInteractive = !!onClick || !!href;

  const content = (
    <div
      className={cn(
        summaryCardVariants({ variant, size }),
        isInteractive && 'cursor-pointer',
        onClick && 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
      {...(onClick && !href ? { role: 'button', tabIndex: 0, onClick, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } } : {})}
    >
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-start gap-2">
          {Icon && isFeature && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-200">
              <Icon className="h-5 w-5" />
            </div>
          )}
          {Icon && !isFeature && <Icon className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground" />}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={cn('font-semibold leading-6 tracking-[-0.2px] text-foreground line-clamp-2', titleSizeMap[resolvedSize])}>
                {title}
              </h4>
              {badge && typeof badge === 'string' ? <Badge variant="default" size="sm">{badge}</Badge> : badge}
            </div>
            {description && <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>}
          </div>
        </div>
      </div>
      {footer && (
        <div className="flex w-full items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">{footer}</div>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
}

export { summaryCardVariants };
export default SummaryCard;
