'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Database,
  GitBranch,
  Users,
  Settings,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppNavItem {
  label: string;
  href: (appId: string) => string;
  icon: LucideIcon;
  /** Match this segment exactly, otherwise `startsWith` is used. */
  exact?: boolean;
}

const NAV_ITEMS: AppNavItem[] = [
  { label: 'Overview', href: (id) => `/apps/${id}`, icon: LayoutDashboard, exact: true },
  { label: 'Tables', href: (id) => `/apps/${id}/tables`, icon: Database },
  { label: 'Relationships', href: (id) => `/apps/${id}/relationships`, icon: GitBranch },
  { label: 'Roles', href: (id) => `/apps/${id}/roles`, icon: Users },
  { label: 'Settings', href: (id) => `/apps/${id}/settings`, icon: Settings },
];

export function AppTabsNav({ appId }: { appId: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="App sections"
      className="flex items-center gap-1 border-b border-border overflow-x-auto"
    >
      {NAV_ITEMS.map((item) => {
        const href = item.href(appId);
        const active = item.exact ? pathname === href : pathname.startsWith(href);
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px transition-colors',
              active
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
