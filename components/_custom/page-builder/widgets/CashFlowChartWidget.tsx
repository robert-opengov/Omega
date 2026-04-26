'use client';

import { LineChart } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function CashFlowChartWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={LineChart}
      label="Cash Flow Chart"
      description="Time-series chart of cash inflows, outflows, and net position."
      expectedFields={['period', 'inflow', 'outflow', 'net']}
      notes="Implementation pending — aggregates records by period, respects DataBinding."
    />
  );
}
