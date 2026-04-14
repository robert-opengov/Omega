'use client';

import { useRef, useEffect, useState } from 'react';
import { useSidebar, useTheme, useAuth } from '@/providers';
import { Menu, Moon, Sun, X, HelpCircle, Bell, Settings, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { appConfig } from '@/config/app.config';
import { navigationItems, isRouteActive, isFeatureEnabled } from '@/config/navigation.config';
import { cn } from '@/lib/utils';
import { Logo, LogoMark } from './Logo';

export interface NavbarProps {
  standalone?: boolean;
}

const NAVBAR_HEIGHT = 52;

function UserAvatar({ name }: { name?: string }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  return (
    <div
      className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0"
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

function NavIconButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center h-7 w-7 rounded-full',
        'text-text-secondary hover:text-text-primary hover:bg-action-hover',
        'transition-colors duration-200',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function NavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLElement>(null);
  const { user } = useAuth();

  useEffect(() => { if (open) onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    if (!open || !drawerRef.current) return;
    const els = drawerRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled])');
    els[0]?.focus();
  }, [open]);

  const visibleItems = navigationItems.filter(
    (item) =>
      isFeatureEnabled(item, appConfig.features) &&
      (!item.roles?.length || item.roles.includes(user?.role ?? '')) &&
      (item.showIn ?? 'both') !== 'sidebar',
  );

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-[var(--z-overlay)] transition-opacity duration-300',
          open ? 'opacity-100 bg-overlay backdrop-blur-sm' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={drawerRef}
        role={open ? 'dialog' : undefined}
        aria-modal={open || undefined}
        aria-label={open ? 'Navigation menu' : undefined}
        className="fixed top-0 left-0 h-screen w-72 z-[var(--z-overlay)] flex flex-col bg-background border-r border-border transition-transform duration-300 ease-in-out"
        style={{ transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        <div
          className="flex items-center justify-between px-4 border-b border-border"
          style={{ height: NAVBAR_HEIGHT }}
        >
          <span className="text-sm font-semibold text-foreground">{appConfig.name}</span>
          <NavIconButton onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </NavIconButton>
        </div>
        <nav aria-label="Main navigation" className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.href, pathname);
            return (
              <div key={item.href}>
                {item.divider && <div className="my-2 border-t border-border" />}
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-action-hover text-primary'
                      : 'text-text-secondary hover:bg-action-hover hover:text-text-primary',
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

/**
 * CDS-37 Global Navigation bar — matches the OpenGov design system.
 *
 * Layout: [hamburger] [Logo] | [App Name ↓] [Tab Tab Tab …]  ——  [🌙] [🔔] [?] [⚙] [Avatar]
 *
 * - `standalone` = false (default): hamburger toggles sidebar on mobile.
 * - `standalone` = true: hamburger opens a drawer overlay on mobile.
 *
 * Height is always 52 px. Active tab shows a 3 px primary-colored bottom indicator.
 */
export function Navbar({ standalone = false }: NavbarProps) {
  const { user } = useAuth();
  const { isMobileOpen, isDesktopCollapsed, toggleMobileOpen, toggleDesktopCollapsed } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const hasSidebar = appConfig.layout.showSidebar && !standalone;

  const visibleItems = navigationItems.filter(
    (item) =>
      isFeatureEnabled(item, appConfig.features) &&
      (!item.roles?.length || item.roles.includes(user?.role ?? '')) &&
      (item.showIn ?? 'both') !== 'sidebar',
  );

  const handleMenuClick = standalone
    ? () => setDrawerOpen(true)
    : () => {
        if (typeof globalThis.window !== 'undefined' && globalThis.matchMedia('(min-width: 1024px)').matches) {
          toggleDesktopCollapsed();
        } else {
          toggleMobileOpen();
        }
      };

  const menuExpanded = standalone ? drawerOpen : isMobileOpen;
  const hamburgerVisibility = hasSidebar && isDesktopCollapsed ? '' : 'lg:hidden';
  const hideBrandingOnDesktop = hasSidebar && !isDesktopCollapsed;

  return (
    <>
      {standalone && <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />}

      <header className="sticky top-0 z-[var(--z-header)] bg-background border-b border-border">
        <div
          className="w-full px-4 flex items-center justify-between overflow-hidden"
          style={{ height: NAVBAR_HEIGHT }}
        >
          {/* ---- Left: hamburger · logo · divider · app name · tabs ---- */}
          <div className="flex items-center min-w-0">
            <NavIconButton
              onClick={handleMenuClick}
              className={cn(hamburgerVisibility, 'mr-3 -ml-1')}
              aria-expanded={menuExpanded}
              aria-label={menuExpanded ? 'Close menu' : 'Open menu'}
            >
              <Menu size={16} />
            </NavIconButton>

            <Link href="/" className={cn('flex items-center shrink-0', hideBrandingOnDesktop && 'lg:hidden')}>
              <Logo className="h-[17px] w-auto hidden sm:block" />
              <LogoMark className="h-5 w-5 sm:hidden" />
            </Link>

            <div className={cn('h-[18px] w-px bg-border mx-3 shrink-0 hidden sm:block', hideBrandingOnDesktop && 'lg:!hidden')} aria-hidden="true" />

            <Link href="/" className={cn('hidden sm:flex items-center gap-1 shrink-0', hideBrandingOnDesktop && 'lg:!hidden')}>
              <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                {appConfig.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
            </Link>

            <nav
              aria-label="Main navigation"
              className="hidden lg:flex items-center ml-4"
              style={{ height: NAVBAR_HEIGHT }}
            >
              {visibleItems.map((item) => {
                const active = isRouteActive(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center px-2 text-xs font-semibold tracking-[0.016em] transition-colors duration-200',
                      active
                        ? 'text-text-primary'
                        : 'text-text-secondary hover:text-text-primary',
                    )}
                    style={{ height: NAVBAR_HEIGHT }}
                  >
                    {item.label}
                    {active && (
                      <span
                        className="absolute bottom-0 inset-x-0 h-[3px] bg-primary rounded-t-sm"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* ---- Right: utility tray ---- */}
          <div className="flex items-center gap-2 shrink-0">
            {appConfig.features.enableDarkMode && (
              <NavIconButton
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </NavIconButton>
            )}

            <div className="relative hidden sm:flex items-center justify-center">
              <NavIconButton aria-label="Notifications">
                <Bell size={16} />
              </NavIconButton>
              {appConfig.features.enableNotifications && (
                <span
                  className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-danger border-2 border-background pointer-events-none"
                  aria-hidden="true"
                />
              )}
            </div>

            <NavIconButton aria-label="Help" className="hidden sm:inline-flex">
              <HelpCircle size={16} />
            </NavIconButton>

            <NavIconButton aria-label="Settings" className="hidden sm:inline-flex">
              <Settings size={16} />
            </NavIconButton>

            {user && (
              <Link
                href="/settings"
                className="shrink-0 ml-1"
                aria-label="Profile settings"
              >
                <UserAvatar name={user.fullName || user.userName} />
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export default Navbar;
