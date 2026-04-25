'use client';

import type { PageLayout } from '@/lib/core/ports/pages.repository';
import { ShowcaseBlockRenderer } from './render/ShowcaseBlockRenderer';
import { cn } from '@/lib/utils';

export interface PageRendererProps {
  layout: PageLayout;
  appId: string;
  className?: string;
}

/**
 * Renders persisted page layout (grid rows → components).
 */
export function PageRenderer({ layout, appId, className }: PageRendererProps) {
  if (!layout?.rows?.length) {
    return (
      <p className="text-sm text-muted-foreground p-4 border border-dashed border-border rounded">
        This page has no content yet.
      </p>
    );
  }

  return (
    <div className={cn('space-y-8', className)}>
      {layout.rows.map((row) => (
        <div
          key={row.id}
          className="grid gap-4 w-full"
          style={{
            gridTemplateColumns: `repeat(${row.columns}, minmax(0, 1fr))`,
          }}
        >
          {row.components.map((c) => (
            <div
              key={c.id}
              className="min-w-0"
              style={{
                gridColumn: c.colSpan ? `span ${c.colSpan}` : undefined,
              }}
            >
              <ShowcaseBlockRenderer
                type={c.type}
                props={c.props}
                dataBinding={c.dataBinding}
                appId={appId}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
