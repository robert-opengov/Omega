'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/atoms';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WizardStep {
  title: string;
  description?: string;
  content: ReactNode;
}

export interface OnboardingWizardLabels {
  back?: string;
  next?: string;
  finish?: string;
  stepOf?: (current: number, total: number) => string;
}

export interface OnboardingWizardProps {
  steps: WizardStep[];
  onComplete?: () => void;
  className?: string;
  /** Start at a specific step (0-indexed). @default 0 */
  initialStep?: number;
  /** Override default button and step labels for i18n or customisation. */
  labels?: OnboardingWizardLabels;
}

/**
 * Step-based onboarding wizard with numbered indicators, content slots,
 * and back/next/finish navigation.
 */
export function OnboardingWizard({ steps, onComplete, className, initialStep = 0, labels }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const step = steps[currentStep];

  return (
    <div className={cn('space-y-8', className)}>
      {/* Step indicator */}
      <nav aria-label="Wizard progress" className="flex items-center justify-center">
        {steps.map((s, i) => {
          const isCompleted = i < currentStep;
          const isActive = i === currentStep;

          return (
            <div key={i} className="flex items-center">
              {i > 0 && (
                <div
                  className={cn(
                    'h-0.5 w-10 sm:w-16 transition-colors duration-200',
                    isCompleted ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex items-center justify-center h-8 w-8 rounded-full text-xs font-semibold transition-all duration-200 border-2',
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isActive
                        ? 'border-primary text-primary bg-background'
                        : 'border-border text-text-secondary bg-background',
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium hidden sm:block max-w-[80px] text-center truncate',
                    isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-text-secondary',
                  )}
                >
                  {s.title}
                </span>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Step content */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">{step.title}</h2>
        {step.description && (
          <p className="text-sm text-text-secondary">{step.description}</p>
        )}
      </div>

      <div className="min-h-[120px]">{step.content}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentStep((s) => s - 1)}
          disabled={isFirst}
        >
          {labels?.back ?? 'Back'}
        </Button>
        <span className="text-xs text-text-secondary">
          {labels?.stepOf ? labels.stepOf(currentStep + 1, steps.length) : `Step ${currentStep + 1} of ${steps.length}`}
        </span>
        {isLast ? (
          <Button size="sm" onClick={onComplete}>
            {labels?.finish ?? 'Finish'}
          </Button>
        ) : (
          <Button size="sm" onClick={() => setCurrentStep((s) => s + 1)}>
            {labels?.next ?? 'Next'}
          </Button>
        )}
      </div>
    </div>
  );
}

export default OnboardingWizard;
