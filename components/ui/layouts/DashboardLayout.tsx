'use client';

import { useState, useEffect, useMemo } from 'react';
import { Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/ui/organisms/Sidebar';
import { Navbar } from '@/components/ui/organisms/Navbar';
import { CommandPalette, type CommandItem } from '@/components/ui/molecules/CommandPalette';
import { ToastContainer } from '@/components/ui/molecules/Toast';
import { useSidebar, useAuth } from '@/providers';
import { appConfig } from '@/config/app.config';
import { navigationItems, flattenNavItems } from '@/config/navigation.config';

const SKIP_LINK = (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-overlay focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded focus:text-sm focus:font-medium"
  >
    Skip to main content
  </a>
);

function MainArea({ children, navbarHeight }: { children: React.ReactNode; navbarHeight: number }) {
  return (
    <main
      id="main-content"
      className="bg-background flex flex-col"
      style={{ minHeight: `calc(100vh - ${navbarHeight}px)` }}
    >
      <div className="flex-1 w-full">{children}</div>
    </main>
  );
}

function NavbarSidebarLayout({ children }: { children: React.ReactNode }) {
  const { isDesktopCollapsed } = useSidebar();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      {SKIP_LINK}
      <Sidebar />
      <div className={`min-h-screen transition-all duration-300 ${mounted ? (isDesktopCollapsed ? 'lg:ml-0' : 'lg:ml-64') : ''}`}>
        <Navbar />
        <MainArea navbarHeight={52}>{children}</MainArea>
      </div>
    </>
  );
}

function NavbarOnlyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {SKIP_LINK}
      <Navbar standalone />
      <MainArea navbarHeight={52}>{children}</MainArea>
    </>
  );
}

function MobileMenuBar() {
  const { toggleMobileOpen } = useSidebar();
  return (
    <div className="sticky top-0 z-header flex items-center h-12 px-4 bg-background border-b border-border lg:hidden">
      <button
        onClick={toggleMobileOpen}
        className="p-2 -ml-2 rounded text-muted-foreground hover:bg-muted transition-all duration-300 ease-in-out"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <span className="ml-2 text-sm font-semibold text-foreground">{appConfig.name}</span>
    </div>
  );
}

function SidebarOnlyLayout({ children }: { children: React.ReactNode }) {
  const { isDesktopCollapsed } = useSidebar();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      {SKIP_LINK}
      <Sidebar />
      <div className={`min-h-screen transition-all duration-300 ${mounted ? (isDesktopCollapsed ? 'lg:ml-0' : 'lg:ml-64') : ''}`}>
        <MobileMenuBar />
        <MainArea navbarHeight={0}>{children}</MainArea>
      </div>
    </>
  );
}

function NoneLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {SKIP_LINK}
      <MainArea navbarHeight={0}>{children}</MainArea>
    </>
  );
}

function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const items: CommandItem[] = useMemo(() => {
    const flat = flattenNavItems(navigationItems, appConfig.features, user?.role);
    return flat.map((nav) => ({
      label: nav.label,
      value: nav.href,
      icon: nav.icon,
      description: `Go to ${nav.label}`,
      onSelect: () => { router.push(nav.href); setOpen(false); },
    }));
  }, [user?.role, router]);

  return <CommandPalette open={open} onOpenChange={setOpen} items={items} placeholder="Where do you want to go?" />;
}

const LAYOUT_MAP = {
  'navbar-sidebar': NavbarSidebarLayout,
  'navbar-only': NavbarOnlyLayout,
  'sidebar-only': SidebarOnlyLayout,
  'none': NoneLayout,
} as const;

/**
 * The primary application layout. Renders navbar, sidebar, or both
 * based on `appConfig.layout.mode`.
 *
 * Modes (configurable via `NEXT_PUBLIC_LAYOUT_MODE` or `config/app.config.ts`):
 * - `navbar-sidebar` — Top navbar + left sidebar (default)
 * - `navbar-only`    — Full-width top navbar, no sidebar
 * - `sidebar-only`   — Left sidebar only, no top navbar
 * - `none`           — No chrome at all (landing pages, kiosk apps)
 *
 * @example
 * <DashboardLayout>{children}</DashboardLayout>
 */
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const Layout = LAYOUT_MAP[appConfig.layout.mode];
  return (
    <>
      <Layout>{children}</Layout>
      <GlobalCommandPalette />
      <ToastContainer />
    </>
  );
}

export default DashboardLayout;
