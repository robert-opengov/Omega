'use client';

import type { TextLayoutItem } from '@/lib/core/ports/form.repository';

export function TextItem({ item }: Readonly<{ item: TextLayoutItem }>) {
  return (
    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
      {item.text ?? ''}
    </p>
  );
}
