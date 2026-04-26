'use client';

import { Building2 } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function DepartmentSubmissionTrackerWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={Building2}
      label="Department Submission Tracker"
      description="Tracks per-department submissions during a budget cycle (submitted / pending / overdue)."
      expectedFields={['department', 'cycleId', 'status', 'submittedAt']}
      notes="Implementation pending — groups submissions by department + cycle."
    />
  );
}
