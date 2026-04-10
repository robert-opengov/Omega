'use client';

import { useState, type HTMLAttributes } from 'react';
import { Info, X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const disclaimerVariants = cva(
  'flex items-start gap-2 text-sm transition-all duration-200',
  {
    variants: {
      variant: {
        inline: 'text-muted-foreground py-1',
        banner: 'px-4 py-3 rounded border bg-warning-light border-warning-light-border text-warning-text',
      },
    },
    defaultVariants: { variant: 'inline' },
  }
);

export interface AIDisclaimerProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof disclaimerVariants> {
  /** Custom disclaimer message. */
  message?: string;
  /** When true, shows a dismiss button. */
  dismissible?: boolean;
}

/**
 * An AI content disclaimer that warns users about AI-generated output.
 *
 * Available as an inline hint or a full-width banner. Matches
 * the CDS-37 AI Disclaimer component pattern.
 *
 * @example
 * <AIDisclaimer />
 *
 * @example
 * <AIDisclaimer variant="banner" dismissible message="Content may not be accurate." />
 */
export function AIDisclaimer({
  message = 'AI-generated content may contain errors. Please verify important information.',
  variant,
  dismissible,
  className,
  ...props
}: AIDisclaimerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div role="status" className={cn(disclaimerVariants({ variant }), className)} {...props}>
      <Info className="h-4 w-4 shrink-0 mt-0.5" />
      <span className="flex-1">{message}</span>
      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 p-0.5 rounded hover:bg-dismiss-hover transition-colors duration-200"
          aria-label="Dismiss disclaimer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default AIDisclaimer;
