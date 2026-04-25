'use client';

import type { ChildGridLayoutItem } from '@/lib/core/ports/form.repository';

export function ChildGridItem({ item }: Readonly<{ item: ChildGridLayoutItem }>) {
  return (
    <div className="rounded border border-border bg-card p-3">
      <p className="text-sm font-medium text-foreground">Child Grid</p>
      <p className="text-xs text-muted-foreground mt-1">
        Read-only child table preview for table <code>{item.childConfig?.tableId ?? 'unknown'}</code>.
      </p>
    </div>
  );
}
