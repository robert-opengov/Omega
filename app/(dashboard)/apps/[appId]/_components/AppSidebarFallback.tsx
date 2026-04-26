'use client';

import { LayoutTemplate } from 'lucide-react';
import { Text } from '@/components/ui/atoms';

/**
 * Static placeholder shown when `listPages` fails or returns no pages.
 * Keeps the layout stable so toggling the sidebar flag is non-destructive.
 */
export function AppSidebarFallback({ message }: { message?: string }) {
  return (
    <aside
      aria-label="App pages"
      className="hidden lg:flex w-56 shrink-0 flex-col border-r border-border bg-card"
    >
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
        <Text size="xs" color="muted" className="uppercase tracking-wide font-medium">
          Pages
        </Text>
      </div>
      <div className="p-4">
        <Text size="sm" color="muted">
          {message ?? 'No pages yet. Create a page from the Pages tab.'}
        </Text>
      </div>
    </aside>
  );
}
