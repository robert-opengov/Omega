'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/organisms/Logo';
import { UILink } from '@/components/ui/atoms/Link';
import { appConfig } from '@/config/app.config';

export interface WizardLayoutProps {
  children: ReactNode;
  className?: string;
  /** Product name shown below the logo (e.g. "Grants Management"). */
  productName?: string;
  /**
   * Footer content at the bottom of the viewport.
   * - `undefined` — renders the default legal footer (copyright + links)
   * - `false` — hides the footer entirely
   * - `ReactNode` — renders custom footer content
   */
  footer?: ReactNode | false;
}

function DefaultFooter() {
  const year = new Date().getFullYear();

  return (
    <div className="px-8 py-5 shrink-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
      <span>&copy; {year} {appConfig.name}</span>
      <span className="hidden sm:inline" aria-hidden="true">|</span>
      <UILink href="#" size="sm" color="muted" display="inline">Terms of Use</UILink>
      <UILink href="#" size="sm" color="muted" display="inline">Privacy Policy</UILink>
      <UILink href="#" size="sm" color="muted" display="inline" className="hidden sm:inline-flex">CA Privacy Notice</UILink>
      <UILink href="#" size="sm" color="muted" display="inline" className="hidden sm:inline-flex">Accessibility Statement</UILink>
    </div>
  );
}

/**
 * Full-screen wizard layout aligned with CDS-37.
 *
 * Renders a light-gray viewport with the logo + product name top-left,
 * content centered vertically, and a composable footer pinned bottom-left.
 * Used by FullscreenWizard to wrap each step's WizardCard.
 */
export function WizardLayout({ children, className, productName, footer }: WizardLayoutProps) {
  return (
    <div className={cn('flex flex-col min-h-screen bg-muted', className)}>
      <div className="px-8 pt-6 pb-2 shrink-0">
        <Logo className="h-6" />
        {productName && (
          <span className="block text-sm font-semibold text-foreground mt-1">
            {productName}
          </span>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8">
        {children}
      </div>

      {footer !== false && (
        footer ?? <DefaultFooter />
      )}
    </div>
  );
}

export default WizardLayout;
