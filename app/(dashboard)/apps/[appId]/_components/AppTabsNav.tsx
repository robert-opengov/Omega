'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { APP_TABS, type AppTab } from './app-tabs.config';
import { useModuleFlags } from '@/providers/module-flags-provider';

/**
 * Per-app top navigation. Reads from `APP_TABS` and filters out any tab
 * whose module flag is disabled in `modulesConfig`. Both the link and the
 * underlying route handler must be gated together (each `page.tsx` calls
 * `featureGuard(...)` with the same module path) so a removed feature can
 * never be reached via direct URL either.
 */
export function AppTabsNav({ appId }: { appId: string }) {
  const pathname = usePathname();
  const modules = useModuleFlags();

  const visibleTabs = APP_TABS.filter((tab: AppTab) => {
    if (!tab.feature) return true;
    const [cat, leaf] = tab.feature.split('.') as [keyof typeof modules, string];
    const group = modules[cat] as unknown as Record<string, boolean> | undefined;
    return Boolean(group?.[leaf]);
  });

  return (
    <nav
      aria-label="App sections"
      className="flex items-center gap-1 border-b border-border overflow-x-auto"
    >
      {visibleTabs.map((tab) => {
        const href = tab.href(appId);
        const active = tab.exact ? pathname === href : pathname.startsWith(href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.id}
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
