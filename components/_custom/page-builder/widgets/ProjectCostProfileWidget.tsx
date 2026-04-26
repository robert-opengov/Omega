'use client';

import { PieChart } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function ProjectCostProfileWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={PieChart}
      label="Project Cost Profile"
      description="Stacked breakdown of project costs by phase or expense category."
      expectedFields={['phase', 'category', 'amount']}
      notes="Implementation pending — toggles between phase- and category-grouped views."
    />
  );
}
