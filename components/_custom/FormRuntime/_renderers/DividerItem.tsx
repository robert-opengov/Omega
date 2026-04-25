'use client';

import { Separator } from '@/components/ui/atoms';
import type { DividerLayoutItem } from '@/lib/core/ports/form.repository';

export function DividerItem({ item }: Readonly<{ item: DividerLayoutItem }>) {
  return (
    <div className="space-y-2">
      {item.text ? <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.text}</p> : null}
      <Separator />
    </div>
  );
}
