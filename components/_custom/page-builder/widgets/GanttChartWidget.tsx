'use client';

import { GanttChart } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function GanttChartWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={GanttChart}
      label="Gantt Chart"
      description="Project schedule with task bars, dependencies, and a timeline header."
      expectedFields={['name', 'startDate', 'endDate', 'progress', 'parentId']}
      notes="Implementation pending — wire to gabDataRepo.queryRecords with date binding."
    />
  );
}
