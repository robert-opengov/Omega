'use client';

import type { HeaderLayoutItem } from '@/lib/core/ports/form.repository';

export function HeaderItem({ item }: Readonly<{ item: HeaderLayoutItem }>) {
  return (
    <h3 className="text-lg font-semibold text-foreground">
      {item.text || 'Section header'}
    </h3>
  );
}
