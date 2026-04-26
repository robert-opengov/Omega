'use client';

import { CalendarRange } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function FiveYearCipOverviewWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={CalendarRange}
      label="5-Year CIP Overview"
      description="Five-year capital improvement plan summary by department and project."
      expectedFields={['department', 'project', 'year1', 'year2', 'year3', 'year4', 'year5']}
      notes="Implementation pending — totals each column and shows funding sources."
    />
  );
}
