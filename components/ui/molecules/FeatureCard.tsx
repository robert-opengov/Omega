'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/atoms';
import Link from 'next/link';
import type { ComponentType } from 'react';

export interface FeatureCardProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href?: string;
  badge?: string;
  className?: string;
}

export function FeatureCard({ icon: Icon, title, description, href, badge, className }: Readonly<FeatureCardProps>) {
  const content = (
    <div
      className={cn(
        'group relative rounded border border-border bg-card p-6 transition-all duration-200',
        'hover:shadow-medium hover:border-primary/30',
        href && 'cursor-pointer',
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors duration-200">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {badge && <Badge variant="default" size="sm">{badge}</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
}

export default FeatureCard;
