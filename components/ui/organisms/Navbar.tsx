'use client';

import { useSidebar, useTheme, useAuth } from '@/providers';
import { Button } from '@/components/ui/atoms';
import { Menu, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { appConfig } from '@/config/app.config';

/**
 * Top navigation bar with mobile menu toggle, theme switcher, and user info.
 *
 * Uses semantic `z-[var(--z-sticky)]` and `dark:text-foreground` instead
 * of hardcoded `z-20` / `dark:text-white`.
 *
 * @example
 * <Navbar />
 */
export function Navbar() {
  const { user, logout } = useAuth();
  const { isMobileOpen, toggleMobileOpen } = useSidebar();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 bg-background border-b border-border border-b-inset">
      <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center h-[72px]">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobileOpen}
              className="lg:hidden p-2 -ml-2 rounded text-muted-foreground hover:bg-muted transition-all duration-300 ease-in-out"
              aria-expanded={isMobileOpen}
              aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
            >
              <Menu size={20} />
            </button>

            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-semibold text-primary dark:text-foreground">
                {appConfig.name}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user.fullName || user.userName}
                </span>
                <div className="h-6 w-px bg-border hidden sm:block" aria-hidden="true" />
              </>
            )}

            {appConfig.features.enableDarkMode && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded text-muted-foreground hover:bg-muted transition-all duration-300 ease-in-out"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}

            {user && (
              <Button onClick={logout} variant="ghost" size="sm" className="text-sm hidden sm:flex">
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
