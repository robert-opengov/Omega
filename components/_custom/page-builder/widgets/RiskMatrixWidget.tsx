'use client';

import { AlertTriangle } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function RiskMatrixWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={AlertTriangle}
      label="Risk Matrix"
      description="5×5 likelihood × impact heat map with risk dots from a bound table."
      expectedFields={['title', 'likelihood', 'impact', 'owner']}
      notes="Implementation pending — buckets risks into the matrix cells."
    />
  );
}
