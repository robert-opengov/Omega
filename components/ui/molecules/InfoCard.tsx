'use client';

import { type ReactNode, type ElementType, isValidElement } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/atoms';
import type { ComponentAction } from '@/components/ui/types';

const infoCardVariants = cva('rounded border space-y-2', {
  variants: {
    variant: {
      default: 'border-border bg-card',
      highlighted: 'border-primary bg-primary-light shadow-soft',
    },
    size: {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-5',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
});

export interface InfoCardProps extends VariantProps<typeof infoCardVariants> {
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  icon?: ElementType | ReactNode;
  actions?: ComponentAction[];
  children?: ReactNode;
  className?: string;
}

export function InfoCard({
  title,
  description,
  badge,
  icon,
  actions,
  children,
  variant,
  size,
  className,
}: InfoCardProps) {
  let iconElement: ReactNode = null;
  if (icon) {
    if (isValidElement(icon)) {
      iconElement = icon;
    } else {
      const IconComponent = icon as ElementType;
      iconElement = <IconComponent className="h-5 w-5 shrink-0 mt-0.5 text-primary" aria-hidden="true" />;
    }
  }

  return (
    <div className={cn(infoCardVariants({ variant, size }), className)}>
      <div className="flex items-start gap-3">
        {badge && !iconElement && <div className="shrink-0">{badge}</div>}
        {iconElement}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 ml-8">
          {actions.map((action) => (
            <Button key={action.label} variant={action.variant || 'outline'} size="sm" onClick={action.onClick} icon={action.icon}>
              {action.label}
            </Button>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

export { infoCardVariants };
export default InfoCard;
