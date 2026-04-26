'use client';

import { ArrowUpDown } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function BudgetChangeManagerWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={ArrowUpDown}
      label="Budget Change Manager"
      description="Workflow for budget transfers, increases, and decreases with approvals."
      expectedFields={['fromAccount', 'toAccount', 'amount', 'status']}
      notes="Implementation pending — surfaces approval state from a workflow port."
    />
  );
}
