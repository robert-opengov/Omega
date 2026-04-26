'use client';

import { HeartPulse } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function HealthScorecardWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={HeartPulse}
      label="Health Scorecard"
      description="At-a-glance project health rollup with red/yellow/green pillars."
      expectedFields={['scope', 'schedule', 'cost', 'quality']}
      notes="Implementation pending — each pillar maps to a status field."
    />
  );
}
