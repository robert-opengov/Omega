'use client';

import { Activity } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function KpiSparklineWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={Activity}
      label="KPI Sparkline"
      description="Compact KPI tile with current value, delta, and embedded sparkline."
      expectedFields={['period', 'value']}
      notes="Implementation pending — shows the trailing N periods from binding."
    />
  );
}
