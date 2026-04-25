'use client';

import { EmptyState } from '@/components/ui/molecules/EmptyState';
import type { WidgetLayoutItem } from '@/lib/core/ports/form.repository';

export function WidgetItem({ item }: Readonly<{ item: WidgetLayoutItem }>) {
  return (
    <EmptyState
      status="info"
      size="small"
      title={item.widgetLabel ?? 'Widget'}
      description="Widget rendering deferred to the Pages phase."
    />
  );
}
