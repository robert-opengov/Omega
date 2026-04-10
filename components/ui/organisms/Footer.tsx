'use client';

import { cn } from '@/lib/utils';
import { appConfig } from '@/config/app.config';
import Link from 'next/link';
import { Logo } from './Logo';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface FooterProps {
  brandName?: string;
  sections?: FooterSection[];
  legalText?: string;
  className?: string;
}

export function Footer({
  brandName,
  sections,
  legalText,
  className,
}: Readonly<FooterProps>) {
  const name = brandName ?? appConfig.name;
  const year = new Date().getFullYear();
  const legal = legalText ?? `© ${year} ${name}. All rights reserved.`;

  return (
    <footer className={cn('border-t border-border bg-secondary/30 mt-auto', className)}>
      <div className="px-6 lg:px-8 py-8">
        {sections && sections.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-semibold text-foreground mb-3">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Logo className="h-4 w-auto opacity-60" />
            <span className="text-xs text-muted-foreground">{name}</span>
          </div>
          <p className="text-xs text-muted-foreground">{legal}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
