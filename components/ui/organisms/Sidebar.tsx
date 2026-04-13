'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, PanelLeftClose } from 'lucide-react';
import { useSidebar, useAuth } from '@/providers';
import { navigationItems, userMenuItems, isRouteActive, isFeatureEnabled } from '@/config/navigation.config';
import type { UserMenuItem } from '@/config/navigation.config';
import { appConfig } from '@/config/app.config';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';

function UserMenuItemRow({ item, onAction }: { item: UserMenuItem; onAction: (action: string) => void }) {
  const shared = cn(
    'flex items-center gap-2 rounded-[4px] py-1 pl-10 pr-2 text-sm tracking-[0.017em] leading-[1.43] transition-colors duration-200',
    'text-text-primary font-normal hover:bg-action-hover',
  );

  if (item.href) {
    return (
      <Link href={item.href} className={shared}>
        <span className="flex-1 truncate">{item.label}</span>
      </Link>
    );
  }

  return (
    <button
      onClick={() => item.action && onAction(item.action)}
      className={cn(shared, 'w-full text-left')}
    >
      <span className="flex-1 truncate">{item.label}</span>
    </button>
  );
}

/**
 * CDS-37 sidebar navigation content.
 * Text-only tree navigation with chevron indicators — no per-item icons.
 * @internal
 */
function NavigationContent({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const { toggleDesktopCollapsed } = useSidebar();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const visibleItems = navigationItems.filter((item) => {
    if (!isFeatureEnabled(item, appConfig.features)) return false;
    if (item.roles?.length && !item.roles.includes(user?.role ?? '')) return false;
    return (item.showIn ?? 'both') !== 'navbar';
  });

  const handleUserAction = (action: string) => {
    if (action === 'logout') logout();
  };

  return (
    <>
      {/* ---- Header: logo + collapse toggle (matches navbar 53px) ---- */}
      <div className="flex items-center justify-between border-b border-border px-4" style={{ height: 53 }}>
        <Link href="/" className="flex items-center min-w-0 text-foreground">
          <Logo />
        </Link>
        {!isMobile && (
          <button
            onClick={toggleDesktopCollapsed}
            className="flex-shrink-0 p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-action-hover transition-colors duration-200"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {/* ---- Navigation items ---- */}
      <nav aria-label="Main navigation" className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = isRouteActive(item.href, pathname);

          return (
            <div key={item.href}>
              {item.divider && (
                <div className="mb-4 border-t border-border" />
              )}
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-[4px] py-0.5 pl-6 pr-2 text-sm tracking-[0.017em] leading-[1.43] transition-colors duration-200',
                  isActive
                    ? 'bg-secondary text-text-primary font-normal'
                    : 'text-text-primary font-normal hover:bg-action-hover',
                )}
              >
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* ---- Footer: expandable user menu ---- */}
      {user && (
        <div className="border-t border-border px-4 py-3">
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 w-full text-left group"
            aria-expanded={userMenuOpen}
            aria-label="User menu"
          >
            <ChevronRight
              className={cn(
                'w-4 h-4 flex-shrink-0 text-text-secondary transition-transform duration-200',
                userMenuOpen && 'rotate-90',
              )}
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-text-primary truncate tracking-[0.017em] leading-[1.43]">
              {user.fullName || user.userName}
            </span>
          </button>

          <div
            ref={menuRef}
            className="overflow-hidden transition-[max-height] duration-200 ease-in-out"
            style={{ maxHeight: userMenuOpen ? menuRef.current?.scrollHeight ?? 200 : 0 }}
          >
            <div className="mt-1 space-y-0.5">
              {userMenuItems.map((item) => (
                <div key={item.label}>
                  {item.divider && <div className="my-1.5 border-t border-border" />}
                  <UserMenuItemRow item={item} onAction={handleUserAction} />
                </div>
              ))}
            </div>
          </div>
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
        <NavigationContent isMobile />
      </aside>
    </>
  );
}

/**
 * Desktop persistent sidebar.
 * Slides fully off-screen when collapsed (no icon-only strip).
 * @internal
 */
function DesktopSidebar() {
  const { isDesktopCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 bottom-0 bg-background border-r border-border z-[var(--z-ground)] hidden lg:flex flex-col w-64 transition-transform duration-300 ease-in-out',
        isDesktopCollapsed ? '-translate-x-full' : 'translate-x-0',
      )}
    >
      <NavigationContent />
    </aside>
  );
}

/**
 * Application sidebar — CDS-37 text-based tree navigation.
 *
 * Desktop: fixed 256px panel that slides off-screen when collapsed.
 * Mobile: slide-out drawer with backdrop overlay and focus trapping.
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
