'use client';

import { useState, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const siteBannerVariants = cva(
  'w-full text-xs',
  {
    variants: {
      variant: {
        dark: 'bg-foreground text-background',
        light: 'bg-muted text-foreground',
      },
    },
    defaultVariants: { variant: 'dark' },
  },
);

export interface SiteBannerProps extends VariantProps<typeof siteBannerVariants> {
  /** Organization name used for the statement fallback and logo alt text. */
  orgName: string;
  /** Logo — pass a URL string for an `<img>`, or a ReactNode for full control. */
  logo?: string | ReactNode;
  /** Full override for the identity area (logo + org name). Takes precedence over `logo` and `orgName`. */
  orgNameElement?: ReactNode;
  /** Statement text. Defaults to "An official website of the {orgName}." */
  statement?: string;
  /** Toggle label for the expandable section. */
  learnMoreLabel?: string;
  /** Expandable content — any ReactNode (two-column grid, links, icons, etc.). */
  learnMoreContent?: ReactNode;
  variant?: 'dark' | 'light';
  className?: string;
}

function renderIdentity(
  orgName: string,
  logo: string | ReactNode | undefined,
  orgNameElement: ReactNode | undefined,
) {
  if (orgNameElement) return orgNameElement;

  return (
    <span className="inline-flex items-center gap-1.5 font-bold tracking-wide">
      {typeof logo === 'string' ? (
        <img src={logo} alt={orgName} className="h-4 w-auto" />
      ) : (
        logo
      )}
      {orgName}
    </span>
  );
}

export function SiteBanner({
  orgName,
  logo,
  orgNameElement,
  statement,
  learnMoreLabel = "Here's how you know.",
  learnMoreContent,
  variant = 'dark',
  className,
}: Readonly<SiteBannerProps>) {
  const [expanded, setExpanded] = useState(false);

  const resolvedStatement = statement ?? `An official website of the ${orgName}.`;

  return (
    <div className={cn(siteBannerVariants({ variant }), className)}>
      <div className="mx-auto flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 px-4 py-2 text-center sm:text-left">
        {renderIdentity(orgName, logo, orgNameElement)}
        <span className="opacity-80">
          {resolvedStatement}
        </span>
        {learnMoreContent && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className={cn(
              'inline-flex items-center gap-0.5 underline underline-offset-2 transition-colors duration-200',
              variant === 'dark'
                ? 'text-background/80 hover:text-background'
                : 'text-foreground/60 hover:text-foreground',
            )}
            aria-expanded={expanded}
          >
            {learnMoreLabel}
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                expanded && 'rotate-180',
              )}
            />
          </button>
        )}
      </div>

      {learnMoreContent && expanded && (
        <div
          className={cn(
            'border-t px-4 py-3 text-xs',
            variant === 'dark'
              ? 'border-background/10 bg-foreground'
              : 'border-border bg-muted',
          )}
        >
          <div className="mx-auto max-w-screen-lg">
            {learnMoreContent}
          </div>
        </div>
      )}
    </div>
  );
}

export { siteBannerVariants };
export default SiteBanner;
