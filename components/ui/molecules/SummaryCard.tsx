'use client';

import { useId, type ReactNode, type ElementType } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/atoms';
import Link from 'next/link';

const summaryCardVariants = cva(
  'flex rounded border border-border bg-card text-left transition-all duration-200 hover:bg-action-hover-primary hover:shadow-soft w-full',
  {
    variants: {
      variant: {
        default: 'flex-col items-start gap-2',
        feature: 'flex-row items-center gap-3',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
      },
    },
    compoundVariants: [
      { variant: 'default', size: 'sm', class: 'p-3 min-h-[100px]' },
      { variant: 'default', size: 'md', class: 'p-4 min-h-[140px]' },
      { variant: 'default', size: 'lg', class: 'p-5 min-h-[180px]' },
      { variant: 'feature', size: 'sm', class: 'p-3 min-h-0' },
      { variant: 'feature', size: 'md', class: 'p-3 min-h-0' },
      { variant: 'feature', size: 'lg', class: 'p-4 min-h-0' },
    ],
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
  'aria-label'?: string;
}

export function SummaryCard({ title, description, badge, footer, icon: Icon, href, onClick, variant, size, className, ...props }: SummaryCardProps) {
  const resolvedSize = size ?? 'md';
  const isFeature = variant === 'feature';
  const isInteractive = !!onClick || !!href;

  const autoId = useId();
  const descId = description ? `${autoId}-desc` : undefined;
  const labelText = typeof title === 'string' ? title : undefined;
  const ariaLabel = props['aria-label'] ?? labelText;

  const content = (
    <div
      className={cn(
        summaryCardVariants({ variant, size }),
        isInteractive && 'cursor-pointer',
        onClick && 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
      {...(onClick && !href ? {
        role: 'button',
        tabIndex: 0,
        onClick,
        'aria-label': ariaLabel,
        'aria-describedby': descId,
        onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } },
      } : {})}
    >
      {isFeature ? (
        <>
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-200">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className={cn('font-semibold leading-6 tracking-[-0.2px] text-foreground', titleSizeMap[resolvedSize])}>
                {title}
              </h4>
              {badge && typeof badge === 'string' ? <Badge variant="default" size="sm">{badge}</Badge> : badge}
            </div>
            {description && <p id={descId} className="text-sm text-muted-foreground leading-relaxed">{description}</p>}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-start gap-2">
              {Icon && <Icon className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground" aria-hidden="true" />}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={cn('font-semibold leading-6 tracking-[-0.2px] text-foreground line-clamp-2', titleSizeMap[resolvedSize])}>
                    {title}
                  </h4>
                  {badge && typeof badge === 'string' ? <Badge variant="default" size="sm">{badge}</Badge> : badge}
                </div>
                {description && <p id={descId} className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>}
              </div>
            </div>
          </div>
          {footer && (
            <div className="flex w-full items-center justify-between gap-2 mt-auto">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">{footer}</div>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block" aria-label={ariaLabel} aria-describedby={descId}>
        {content}
      </Link>
    );
  }
  return content;
}

export { summaryCardVariants };
export default SummaryCard;
