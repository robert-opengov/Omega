'use client';

import { TrendingUp } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function EarnedValueChartWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={TrendingUp}
      label="Earned Value Chart"
      description="EVM chart plotting Planned Value, Earned Value, and Actual Cost over time."
      expectedFields={['period', 'pv', 'ev', 'ac']}
      notes="Implementation pending — derives CPI/SPI from the bound records."
    />
  );
}
