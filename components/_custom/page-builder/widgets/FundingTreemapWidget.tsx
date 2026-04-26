'use client';

import { LayoutGrid } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function FundingTreemapWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={LayoutGrid}
      label="Funding Treemap"
      description="Hierarchical treemap of funding sources by category and amount."
      expectedFields={['source', 'category', 'amount']}
      notes="Implementation pending — supports drill-down via DataBinding filter."
    />
  );
}
