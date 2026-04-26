'use client';

import { Bell } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function NeedsAttentionWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={Bell}
      label="Needs Attention"
      description="Curated list of items waiting on the current user (overdue, blocked, assigned)."
      expectedFields={['title', 'reason', 'dueDate']}
      notes="Implementation pending — uses query filters parameterized by the auth user."
    />
  );
}
