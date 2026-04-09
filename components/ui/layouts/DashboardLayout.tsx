'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/ui/organisms/Sidebar';
import { Navbar } from '@/components/ui/organisms/Navbar';
import { ToastContainer } from '@/components/ui/molecules/Toast';
import { useSidebar } from '@/providers';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isDesktopCollapsed } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[var(--z-overlay)] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded focus:text-sm focus:font-medium">
        Skip to main content
      </a>

      <Sidebar />

      <div
        className={`min-h-screen transition-all duration-300 ${mounted ? (isDesktopCollapsed ? 'lg:ml-20' : 'lg:ml-64') : ''}`}
      >
        <Navbar />

        <main id="main-content" className="bg-muted dark:bg-background min-h-[calc(100vh-72px)] dot-pattern flex flex-col">
          <div className="flex-1 w-full">
            {children}
          </div>
        </main>
      </div>

      <ToastContainer />
    </>
  );
}

/**
 * The primary application layout with sidebar, navbar, and toast container.
 *
 * Uses `bg-muted` (OpenGov gray-50 `#F7F9FA`) for the main content
 * background instead of hardcoded `bg-gray-50`.
 *
 * @example
 * <DashboardLayout>{children}</DashboardLayout>
 */
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <LayoutContent>{children}</LayoutContent>;
}

export default DashboardLayout;
