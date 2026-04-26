'use client';

import { Circle } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function PortfolioBubbleWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={Circle}
      label="Portfolio Bubble"
      description="Bubble chart comparing portfolio items on cost / value / risk axes."
      expectedFields={['name', 'cost', 'value', 'risk']}
      notes="Implementation pending — bubbles scaled by `risk`, axes from cost/value."
    />
  );
}
