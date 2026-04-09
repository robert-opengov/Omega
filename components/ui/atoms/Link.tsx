'use client';

import { forwardRef, type AnchorHTMLAttributes, type ElementType } from 'react';
import NextLink from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Link variant styles aligned with OpenGov Capital Design System.
 */
const linkVariants = cva(
  'inline-flex items-center gap-1 font-medium transition-colors duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
  {
    variants: {
      underline: {
        hover: 'no-underline hover:underline underline-offset-4',
        always: 'underline underline-offset-4',
        none: 'no-underline',
      },
      color: {
        primary: 'text-primary hover:text-primary/80',
        foreground: 'text-foreground hover:text-foreground/80',
        muted: 'text-muted-foreground hover:text-foreground',
        destructive: 'text-destructive hover:text-destructive/80',
      },
    },
    defaultVariants: { underline: 'hover', color: 'primary' },
  }
);

export interface UILinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'color'>,
    VariantProps<typeof linkVariants> {
  /** When true, opens in a new tab with secure rel attributes. */
  external?: boolean;
  /** Optional trailing icon component. Defaults to ExternalLink when external. */
  icon?: ElementType;
}

/**
 * A semantic navigation link that wraps Next.js Link for internal routes
 * and renders a plain anchor for external URLs.
 *
 * Unlike `Button variant="link"`, this renders as a true `<a>` element
 * with proper underline behavior and external-link affordances.
 *
 * @example
 * <UILink href="/settings">Settings</UILink>
 *
 * @example
 * <UILink href="https://docs.opengov.com" external>Documentation</UILink>
 */
const UILink = forwardRef<HTMLAnchorElement, UILinkProps>(
  ({ href, underline, color, external, icon: IconProp, className, children, ...props }, ref) => {
    const classes = cn(linkVariants({ underline, color }), className);
    const Icon = IconProp ?? (external ? ExternalLink : null);
    const externalProps = external
      ? { target: '_blank' as const, rel: 'noopener noreferrer' }
      : {};

    const content = (
      <>
        {children}
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      </>
    );

    const isInternal = href && href.startsWith('/');

    if (isInternal && !external) {
      return (
        <NextLink ref={ref} href={href} className={classes} {...props}>
          {content}
        </NextLink>
      );
    }

    return (
      <a ref={ref} href={href} className={classes} {...externalProps} {...props}>
        {content}
      </a>
    );
  }
);
UILink.displayName = 'UILink';

export { UILink, linkVariants };
export type { UILinkProps as LinkProps };
export default UILink;
