'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSidebar, useAuth } from '@/providers';
import { navigationItems, isRouteActive } from '@/config/navigation.config';
import { cn } from '@/lib/utils';
import { Logo, LogoMark } from './Logo';

/**
 * Sidebar navigation content shared between mobile and desktop variants.
 * @internal
 */
function NavigationContent({ collapsed = false, isMobile = false }: { collapsed?: boolean; isMobile?: boolean }) {
  const pathname = usePathname();
  const { toggleDesktopCollapsed } = useSidebar();
  const { user } = useAuth();
  const showLabels = !collapsed;

  const visibleItems = navigationItems.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(user?.role ?? '');
  });

  return (
    <>
      <div className="h-[73px] flex items-center justify-center border-b border-border px-4 pt-2 overflow-hidden">
        <Link href="/" className="relative flex items-center justify-center w-full h-full">
          <div
            className={cn(
              'transition-all duration-500 ease-in-out text-foreground',
              collapsed
                ? 'opacity-0 scale-95 -translate-x-4 pointer-events-none'
                : 'opacity-100 scale-100 translate-x-0'
            )}
          >
            <Logo />
          </div>
          <div
            className={cn(
              'absolute transition-all duration-500 ease-in-out',
              collapsed
                ? 'opacity-100 scale-100 translate-x-0'
                : 'opacity-0 scale-95 translate-x-4 pointer-events-none'
            )}
          >
            <LogoMark className="h-8 w-8" />
          </div>
        </Link>
      </div>

      <nav aria-label="Main navigation" className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = isRouteActive(item.href, pathname);

          return (
            <div key={item.href}>
              {item.divider && (
                <div className="my-2 border-t border-border" />
              )}
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded py-3 text-sm font-medium transition-all duration-300 ease-in-out',
                  showLabels ? 'px-4' : 'px-3 justify-center',
                  isActive
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                {showLabels && <span>{item.label}</span>}
              </Link>
            </div>
          );
        })}
      </nav>

      {!isMobile && (
        <div className="p-3">
          <button
            onClick={toggleDesktopCollapsed}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex items-center gap-3 rounded py-2 text-sm w-full transition-all duration-300 ease-in-out',
              'text-muted-foreground hover:bg-muted',
              collapsed ? 'justify-center px-3' : 'px-4'
            )}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      )}
    </>
  );
}

/**
 * Mobile slide-out sidebar with backdrop overlay and focus trapping.
 * @internal
 */
function MobileSidebar() {
  const { isMobileOpen, closeMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isMobileOpen) closeMobileSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileSidebar();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeMobileSidebar]);

  useEffect(() => {
    if (!isMobileOpen || !sidebarRef.current) return;

    const sidebar = sidebarRef.current;
    const focusableEls = sidebar.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusableEls.length > 0) focusableEls[0].focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    sidebar.addEventListener('keydown', handleKeyDown);
    return () => sidebar.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-[var(--z-sticky)] lg:hidden transition-opacity duration-300',
          isMobileOpen ? 'opacity-100 bg-overlay backdrop-blur-sm' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeMobileSidebar}
        aria-hidden="true"
      />
      <aside
        ref={sidebarRef}
        role={isMobileOpen ? 'dialog' : undefined}
        aria-modal={isMobileOpen ? true : undefined}
        aria-label={isMobileOpen ? 'Navigation menu' : undefined}
        className="fixed top-0 left-0 h-screen w-64 z-[var(--z-overlay)] flex flex-col bg-background border-r border-border transition-transform duration-300 ease-in-out lg:hidden"
        style={{ transform: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        <NavigationContent collapsed={false} isMobile />
      </aside>
    </>
  );
}

/**
 * Desktop persistent sidebar with collapsible width.
 * @internal
 */
function DesktopSidebar() {
  const { isDesktopCollapsed } = useSidebar();

  return (
    <aside
      className="fixed top-0 left-0 bottom-0 bg-background border-r border-border z-[var(--z-ground)] hidden lg:flex flex-col transition-all duration-300"
      style={{ width: isDesktopCollapsed ? '80px' : '256px' }}
    >
      <NavigationContent collapsed={isDesktopCollapsed} />
    </aside>
  );
}

/**
 * Application sidebar that renders both mobile (slide-out) and desktop
 * (fixed, collapsible) variants. Uses semantic z-index tokens from the
 * OpenGov z-index scale.
 *
 * @example
 * <Sidebar />
 */
export function Sidebar() {
  return (
    <>
      <MobileSidebar />
      <DesktopSidebar />
    </>
  );
}

export default Sidebar;
