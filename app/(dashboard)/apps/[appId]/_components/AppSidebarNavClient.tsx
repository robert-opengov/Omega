'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import { LayoutTemplate, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/atoms';

export interface SidebarPageItem {
  key: string;
  slug: string;
  name: string;
  icon: string | null;
}

export interface AppSidebarNavClientProps {
  appId: string;
  pages: SidebarPageItem[];
}

function resolveIcon(name: string | null): LucideIcon {
  if (!name) return LayoutTemplate;
  const lookup = (Icons as unknown as Record<string, LucideIcon>)[name];
  return lookup ?? LayoutTemplate;
}

export function AppSidebarNavClient({ appId, pages }: AppSidebarNavClientProps) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="App pages"
      className="hidden lg:flex w-56 shrink-0 flex-col border-r border-border bg-card"
    >
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
        <Text size="xs" color="muted" className="uppercase tracking-wide font-medium">
          Pages
        </Text>
      </div>
      <nav className="flex-1 overflow-y-auto py-2" aria-label="App pages list">
        {pages.length === 0 && (
          <div className="px-4 py-3">
            <Text size="sm" color="muted">
              No pages visible to this role yet.
            </Text>
          </div>
        )}
        {pages.map((p) => {
          const href = `/apps/${appId}/p/${p.slug}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const Icon = resolveIcon(p.icon);
          return (
            <Link
              key={p.key}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 px-3 py-2 mx-2 my-0.5 rounded text-sm transition-colors',
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground/80 hover:bg-action-hover-primary hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{p.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
