'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Table2,
  Columns3,
  SlidersHorizontal,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableTab {
  label: string;
  segment: string;
  icon: LucideIcon;
  /** Match exactly (used for the default Records tab). */
  exact?: boolean;
}

const TABS: TableTab[] = [
  { label: 'Records', segment: '', icon: Table2, exact: true },
  { label: 'Fields', segment: 'fields', icon: Columns3 },
  { label: 'Notifications', segment: 'notifications', icon: Bell },
  { label: 'Settings', segment: 'settings', icon: SlidersHorizontal },
];

export function TableTabsNav({
  appId,
  tableId,
}: {
  appId: string;
  tableId: string;
}) {
  const pathname = usePathname();
  const base = `/apps/${appId}/tables/${tableId}`;

  return (
    <nav aria-label="Table sections" className="flex items-center gap-1 border-b border-border">
      {TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;
        const active = tab.exact ? pathname === href : pathname.startsWith(href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.label}
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
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
