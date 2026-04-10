'use client';

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { WizardLayout, type WizardLayoutProps } from '@/components/ui/layouts/WizardLayout';
import { WizardCard, type WizardCardProps } from '@/components/ui/molecules/WizardCard';

/* ------------------------------------------------------------------ */
/*  Wizard Context                                                    */
/* ------------------------------------------------------------------ */

interface WizardContextValue {
  /** Zero-based index of the active step. */
  currentStep: number;
  /** Total number of steps in the wizard. */
  totalSteps: number;
  /** Advance to the next step. No-op on the last step. */
  next: () => void;
  /** Return to the previous step. No-op on the first step. */
  back: () => void;
  /** Jump to a specific step by index (clamped to valid range). */
  goTo: (step: number) => void;
  /** Whether the current step is the first. */
  isFirst: boolean;
  /** Whether the current step is the last. */
  isLast: boolean;
}

const WizardContext = createContext<WizardContextValue | null>(null);

/**
 * Access wizard navigation from any descendant of `FullscreenWizard`.
 *
 * @example
 * function StepContent() {
 *   const { next, back, currentStep, totalSteps } = useWizard();
 *   return <Button onClick={next}>Continue</Button>;
 * }
 */
export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within a FullscreenWizard');
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Step config                                                       */
/* ------------------------------------------------------------------ */

export interface WizardStepConfig {
  /** Slot content rendered inside the WizardCard body. */
  content: ReactNode;
  /**
   * Props forwarded to the WizardCard for this step.
   * `title` is required; everything else is optional.
   */
  cardProps: Pick<WizardCardProps, 'title'> & Partial<Omit<WizardCardProps, 'title' | 'children'>>;
}

/* ------------------------------------------------------------------ */
/*  FullscreenWizard                                                  */
/* ------------------------------------------------------------------ */

export interface FullscreenWizardProps {
  /** Ordered list of wizard steps. */
  steps: WizardStepConfig[];
  /** Called when the user completes the last step. */
  onComplete?: () => void;
  /** Zero-based starting step. @default 0 */
  initialStep?: number;
  /** Product name passed to WizardLayout (shown below the logo). */
  productName?: string;
  /** Override WizardLayout footer. */
  layoutFooter?: WizardLayoutProps['footer'];
  className?: string;
}

/**
 * Full-screen, multi-step wizard orchestrator.
 *
 * Composes `WizardLayout` (chrome) and `WizardCard` (content card) with a
 * `WizardContext` that exposes `next`, `back`, and `goTo` to any descendant
 * via the `useWizard()` hook. Step content is fully declarative —
 * each step provides its own `content` ReactNode and `cardProps`.
 *
 * @example
 * <FullscreenWizard
 *   productName="Grants Management"
 *   steps={[
 *     {
 *       cardProps: { title: "Choose your role", stepLabel: "Step 1 of 3" },
 *       content: <RoleSelection />,
 *     },
 *     {
 *       cardProps: { title: "Import award", stepLabel: "Step 2 of 3" },
 *       content: <ImportStep />,
 *     },
 *   ]}
 *   onComplete={() => router.push('/dashboard')}
 * />
 */
export function FullscreenWizard({
  steps,
  onComplete,
  initialStep = 0,
  productName,
  layoutFooter,
  className,
}: FullscreenWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const totalSteps = steps.length;

  const next = useCallback(() => {
    setCurrentStep((s) => {
      if (s >= totalSteps - 1) {
        onComplete?.();
        return s;
      }
      return s + 1;
    });
  }, [totalSteps, onComplete]);

  const back = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  const goTo = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(totalSteps - 1, step)));
  }, [totalSteps]);

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  const ctxValue = useMemo(
    () => ({ currentStep, totalSteps, next, back, goTo, isFirst, isLast }),
    [currentStep, totalSteps, next, back, goTo, isFirst, isLast],
  );

  const step = steps[currentStep];
  if (!step) return null;

  const { content, cardProps } = step;

  return (
    <WizardContext.Provider value={ctxValue}>
      <WizardLayout productName={productName} footer={layoutFooter} className={className}>
        <WizardCard {...cardProps}>
          {content}
        </WizardCard>
      </WizardLayout>
    </WizardContext.Provider>
  );
}

export default FullscreenWizard;
