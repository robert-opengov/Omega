'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  label: string;
  description?: string;
}

export interface ProgressStepsProps {
  steps: Step[];
  /** Zero-based index of the current step. */
  currentStep: number;
  /** Callback when a completed step is clicked. */
  onStepClick?: (index: number) => void;
  /** @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

/**
 * A multi-step progress indicator with clickable completed steps.
 *
 * @example
 * <ProgressSteps
 *   steps={[{ label: 'Details' }, { label: 'Review' }, { label: 'Done' }]}
 *   currentStep={1}
 * />
 */
export function ProgressSteps({
  steps,
  currentStep,
  onStepClick,
  orientation = 'horizontal',
  className,
}: ProgressStepsProps) {
  return (
    <nav
      aria-label="Progress"
      className={cn(
        orientation === 'horizontal' ? 'flex items-center' : 'flex flex-col',
        className,
      )}
    >
      {steps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        const isClickable = onStepClick && isCompleted;

        return (
          <div
            key={i}
            className={cn(
              'flex items-center',
              orientation === 'horizontal' ? 'flex-1 last:flex-none' : 'gap-4',
              orientation === 'vertical' && 'pb-8 last:pb-0',
            )}
          >
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(i)}
              className={cn(
                'flex items-center gap-3 group',
                isClickable && 'cursor-pointer',
                !isClickable && 'cursor-default',
              )}
            >
              <div
                className={cn(
                  'relative flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-medium transition-all duration-300 ease-in-out shrink-0',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  isCompleted && 'bg-primary border-primary text-primary-foreground shadow-above',
                  isCurrent && 'border-primary text-primary bg-primary/10 ring-4 ring-primary/10',
                  !isCompleted && !isCurrent && 'border-border text-muted-foreground',
                  isClickable && 'group-hover:shadow-soft group-hover:scale-105',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  i + 1
                )}
              </div>
              <div
                className={cn(
                  orientation === 'horizontal' ? 'hidden sm:block' : '',
                  'text-left',
                )}
              >
                <p
                  className={cn(
                    'text-sm font-medium transition-all duration-300 ease-in-out',
                    isCompleted && 'text-primary',
                    isCurrent && 'text-foreground',
                    !isCompleted && !isCurrent && 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
            </button>

            {orientation === 'horizontal' && i < steps.length - 1 && (
              <div className="flex-1 mx-3 sm:mx-4" aria-hidden="true">
                <div className="h-0.5 w-full rounded-full bg-border overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full bg-primary transition-all duration-500 ease-out',
                      isCompleted ? 'w-full' : 'w-0',
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default ProgressSteps;
