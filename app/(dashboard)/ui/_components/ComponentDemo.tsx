'use client';

import { useState, type ReactNode } from 'react';
import { CardContent } from '@/components/ui/molecules';
import { Badge, Heading, Text } from '@/components/ui/atoms';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComponentDemoProps {
  name: string;
  description?: string;
  props?: string;
  badge?: string;
  id?: string;
  children: ReactNode;
}

export function ComponentDemo({ name, description, props, badge, id, children }: ComponentDemoProps) {
  const [showProps, setShowProps] = useState(false);

  return (
    <div
      id={id ?? name.toLowerCase().replaceAll(/\s+/g, '-')}
      className="rounded-xl border border-border bg-card overflow-hidden scroll-mt-40"
    >
      <div className="px-6 pt-5 pb-3 border-b border-border/60 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Heading as="h3" className="text-base font-semibold text-foreground">{name}</Heading>
          {description && (
            <Text size="sm" color="muted" className="mt-1">{description}</Text>
          )}
        </div>
        {badge && (
          <Badge variant="info" size="sm" className="shrink-0">{badge}</Badge>
        )}
      </div>

      <CardContent className="p-6 bg-background/50">
        {children}
      </CardContent>

      {props && (
        <div className="border-t border-border/60">
          <button
            type="button"
            onClick={() => setShowProps(!showProps)}
            className={cn(
              'flex items-center gap-2 w-full px-6 py-3 text-sm font-medium transition-all duration-200',
              showProps
                ? 'text-foreground bg-muted/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
            )}
          >
            {showProps ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Props & API
          </button>
          {showProps && (
            <div className="px-6 pb-4">
              <pre className="text-xs bg-muted/50 rounded-lg p-4 overflow-x-auto font-mono text-foreground whitespace-pre border border-border/40">
                {props}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  description?: string;
  count?: number;
  children: ReactNode;
}

export function Section({ title, description, count, children }: SectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Heading as="h2" className="text-foreground">{title}</Heading>
        {count != null && (
          <span className="inline-flex items-center justify-center min-w-[22px] h-6 px-2 text-xs font-medium rounded-full bg-muted text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {description && (
        <Text size="sm" color="muted" className="-mt-4">{description}</Text>
      )}
      <div className="grid grid-cols-1 gap-6">
        {children}
      </div>
    </section>
  );
}
