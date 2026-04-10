'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/atoms';

const tiers = [
  { label: 'Overview', href: '/ui', count: null },
  { label: 'Atoms', href: '/ui/atoms', count: 30 },
  { label: 'Molecules', href: '/ui/molecules', count: 40 },
  { label: 'Organisms', href: '/ui/organisms', count: 14 },
] as const;

function getBreadcrumbs(pathname: string) {
  const crumbs: { label: string; href?: string }[] = [
    { label: 'Home', href: '/home' },
    { label: 'UI Showcase', href: '/ui' },
  ];
  const tier = tiers.find((t) => t.href !== '/ui' && pathname.startsWith(t.href));
  if (tier) crumbs.push({ label: tier.label });
  return crumbs;
}

interface ShowcaseLayoutProps {
  children: React.ReactNode;
}

export function ShowcaseLayout({ children }: ShowcaseLayoutProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-[52px] z-10 bg-background border-b border-border">
        <div className="px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="pt-4 pb-2">
            <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, i) => (
                <li key={crumb.label} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden="true" className="text-border">/</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-foreground transition-colors duration-200">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          {/* Header */}
          <div className="flex items-center gap-3 pb-3">
            <h1 className="text-xl font-bold text-foreground">Component Library</h1>
            <Badge variant="info" size="sm">v2</Badge>
          </div>

          {/* Tier tabs */}
          <div className="flex items-center gap-0 -mb-px overflow-x-auto overflow-y-hidden" role="tablist">
            {tiers.map((tier) => {
              const isActive = tier.href === '/ui'
                ? pathname === '/ui'
                : pathname.startsWith(tier.href);

              return (
                <Link
                  key={tier.href}
                  href={tier.href}
                  role="tab"
                  aria-selected={isActive}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors duration-200 border-b-2 -mb-px whitespace-nowrap',
                    isActive
                      ? 'text-primary border-primary'
                      : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border',
                  )}
                >
                  {tier.label}
                  {tier.count != null && (
                    <span
                      className={cn(
                        'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {tier.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
}
