'use client';

import { useState, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/molecules';
import { Heading, Text } from '@/components/ui/atoms';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ComponentDemoProps {
  name: string;
  description?: string;
  /** TypeScript interface/props as a formatted string */
  props?: string;
  children: ReactNode;
}

export function ComponentDemo({ name, description, props, children }: ComponentDemoProps) {
  const [showProps, setShowProps] = useState(false);

  return (
    <Card className="overflow-hidden">
      <div className="px-6 pt-5 pb-3 border-b border-border/50">
        <Heading as="h3" className="text-base font-semibold text-foreground">{name}</Heading>
        {description && (
          <Text size="sm" color="muted" className="mt-1">{description}</Text>
        )}
      </div>

      <CardContent className="p-6">
        {children}
      </CardContent>

      {props && (
        <div className="border-t border-border/50">
          <button
            type="button"
            onClick={() => setShowProps(!showProps)}
            className="flex items-center gap-2 w-full px-6 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300 ease-in-out"
          >
            {showProps ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Props
          </button>
          {showProps && (
            <div className="px-6 pb-4">
              <pre className="text-xs bg-muted/50 rounded p-4 overflow-x-auto font-mono text-foreground whitespace-pre">
                {props}
              </pre>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

interface SectionProps {
  title: string;
  children: ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <section className="space-y-6">
      <Heading as="h2" className="text-foreground">{title}</Heading>
      <div className="grid grid-cols-1 gap-6">
        {children}
      </div>
    </section>
  );
}
