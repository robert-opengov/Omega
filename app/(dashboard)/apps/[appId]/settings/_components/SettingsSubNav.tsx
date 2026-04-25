'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SubNavItem {
  label: string;
  href: (appId: string) => string;
  exact?: boolean;
}

const ITEMS: SubNavItem[] = [
  { label: 'General', href: (id) => `/apps/${id}/settings`, exact: true },
  { label: 'Navigation', href: (id) => `/apps/${id}/settings/navigation` },
  { label: 'Public links', href: (id) => `/apps/${id}/settings/public-links` },
  { label: 'Access tokens', href: (id) => `/apps/${id}/settings/access-tokens` },
];

export function SettingsSubNav({ appId }: { appId: string }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Settings sections"
      className="flex items-center gap-1 border-b border-border overflow-x-auto"
    >
      {ITEMS.map((item) => {
        const href = item.href(appId);
        const active = item.exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={item.label}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex items-center px-3 py-2 text-sm border-b-2 -mb-px transition-colors',
              active
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
