'use client';

import { Calculator } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function BudgetWorksheetWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={Calculator}
      label="Budget Worksheet"
      description="Editable budget worksheet with category subtotals and grand total."
      expectedFields={['category', 'lineItem', 'amount']}
      notes="Implementation pending — supports inline edit + save through bound table."
    />
  );
}
