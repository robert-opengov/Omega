'use client';

import type { ChildSectionLayoutItem } from '@/lib/core/ports/form.repository';

export function ChildSectionItem({ item }: Readonly<{ item: ChildSectionLayoutItem }>) {
  return (
    <div className="rounded border border-border bg-card p-3">
      <p className="text-sm font-medium text-foreground">Child Section</p>
      <p className="text-xs text-muted-foreground mt-1">
        Read-only related section for table <code>{item.childConfig?.tableId ?? 'unknown'}</code>.
      </p>
    </div>
  );
}
