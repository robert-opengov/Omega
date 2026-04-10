'use client';

import { CheckCircle, Circle } from 'lucide-react';
import { Spinner } from '@/components/ui/atoms/Spinner';
import { cn } from '@/lib/utils';

export type ProcessingStepStatus = 'completed' | 'in-progress' | 'pending';

export interface ProcessingStepProps {
  /** Current status of this processing step. */
  status: ProcessingStepStatus;
  /** Text label describing the step. */
  label: string;
  className?: string;
}

/**
 * A single line item in an async processing checklist.
 *
 * Displays a status icon (green check, spinner, or empty circle)
 * alongside a text label. Used inside `ProcessingChecklist`.
 *
 * @example
 * <ProcessingStep status="completed" label="Confirm award details" />
 * <ProcessingStep status="in-progress" label="Map budget categories" />
 * <ProcessingStep status="pending" label="Set reporting deadlines" />
 */
export function ProcessingStep({ status, label, className }: ProcessingStepProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center justify-center h-[22px] w-[22px] shrink-0">
        {status === 'completed' && (
          <CheckCircle className="h-[22px] w-[22px] text-success" />
        )}
        {status === 'in-progress' && (
          <Spinner size="sm" />
        )}
        {status === 'pending' && (
          <Circle className="h-[18px] w-[18px] text-border" />
        )}
      </div>
      <span className="text-base leading-5 tracking-[0.15px] text-foreground">
        {label}
      </span>
    </div>
  );
}

export default ProcessingStep;
