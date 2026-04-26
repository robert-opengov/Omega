'use client';

import { BarChart3 } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function BudgetWaterfallWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={BarChart3}
      label="Budget Waterfall"
      description="Waterfall chart that walks a starting budget through additions and reductions."
      expectedFields={['label', 'amount', 'kind']}
      notes="Implementation pending — kind ∈ {start, increase, decrease, total}."
    />
  );
}
