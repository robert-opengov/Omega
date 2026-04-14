'use client';

import { StatusStep, type StatusStepStatus } from '@/components/ui/atoms/StatusStep';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface StatusChecklistStep {
  label: ReactNode;
  status: StatusStepStatus;
}

export interface StatusChecklistProps {
  steps: StatusChecklistStep[];
  className?: string;
}

export function StatusChecklist({ steps, className }: StatusChecklistProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {steps.map((step, i) => (
        <StatusStep key={i} status={step.status} label={step.label} />
      ))}
    </div>
  );
}

export default StatusChecklist;
