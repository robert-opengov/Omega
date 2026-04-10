'use client';

import { ProcessingStep, type ProcessingStepStatus } from '@/components/ui/atoms/ProcessingStep';
import { cn } from '@/lib/utils';

export interface ProcessingChecklistStep {
  /** Text label describing the step. */
  label: string;
  /** Current status of this step. */
  status: ProcessingStepStatus;
}

export interface ProcessingChecklistProps {
  /** The list of processing steps to display. */
  steps: ProcessingChecklistStep[];
  className?: string;
}

/**
 * A vertical checklist of async processing steps.
 *
 * Renders a list of `ProcessingStep` atoms with consistent spacing.
 * Used in wizard flows to show progress during background operations
 * (e.g. AI-powered document parsing).
 *
 * @example
 * <ProcessingChecklist
 *   steps={[
 *     { label: 'Confirm award details', status: 'completed' },
 *     { label: 'Map budget categories', status: 'in-progress' },
 *     { label: 'Check compliance conditions', status: 'pending' },
 *     { label: 'Set reporting deadlines', status: 'pending' },
 *   ]}
 * />
 */
export function ProcessingChecklist({ steps, className }: ProcessingChecklistProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {steps.map((step, i) => (
        <ProcessingStep key={i} status={step.status} label={step.label} />
      ))}
    </div>
  );
}

export default ProcessingChecklist;
