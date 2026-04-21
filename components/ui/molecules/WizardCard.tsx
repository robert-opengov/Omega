'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface WizardCardProps {
  /** Step indicator label, e.g. "Step 1 of 4". */
  stepLabel?: string;
  /** Large heading at the top of the card. */
  title: string;
  /** Supporting copy below the title. */
  description?: string;
  /** Main content area rendered below the header. */
  children: ReactNode;
  /** Primary + secondary action buttons rendered below the content. */
  actions?: ReactNode;
  /**
   * Footer area rendered below a divider at the bottom of the card.
   * Typically "Have questions?" or "Not ready? Skip..." links.
   */
  footer?: ReactNode;
  className?: string;
}

/**
 * Elevated content card for fullscreen wizard steps.
 *
 * Matches the CDS-37 Grant Management onboarding card:
 * white background, 8px border-radius, `shadow-medium`, max-width 570px,
 * with structured header (step label + h1 + description), content slot,
 * action slot, and optional footer below a divider.
 *
 * @example
 * <WizardCard
 *   stepLabel="Step 1 of 4"
 *   title="Hi [name], let's get you set up"
 *   description="What's your role?"
 *   actions={<Button>Continue</Button>}
 *   footer={<Text size="sm">Have questions? Call us...</Text>}
 * >
 *   {roleSelectionCards}
 * </WizardCard>
 */
export function WizardCard({ stepLabel, title, description, children, actions, footer, className }: WizardCardProps) {
  return (
    <div className={cn('bg-card rounded-lg shadow-medium w-full max-w-[700px]', className)}>
      <div className="flex flex-col gap-6 p-9">
        {/* Header */}
        <div className="flex flex-col gap-2">
          {stepLabel && (
            <span className="text-xs leading-4 tracking-[0.17px] text-text-primary">
              {stepLabel}
            </span>
          )}
          <h1 className="text-[32px] font-semibold leading-[38px] tracking-[-0.25px] text-text-primary">
            {title}
          </h1>
          {description && (
            <p className="text-base leading-5 tracking-[0.15px] text-text-primary">
              {description}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-6">{children}</div>

        {/* Actions */}
        {actions && (
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
            {actions}
          </div>
        )}
      </div>

      {/* Footer — separated by a divider */}
      {footer && (
        <>
          <div className="border-t border-border" />
          <div className="p-9 pt-6">{footer}</div>
        </>
      )}
    </div>
  );
}

export default WizardCard;
