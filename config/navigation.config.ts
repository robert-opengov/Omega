/**
 * Centralized navigation configuration.
 * AI or developer edits ONLY this array to control sidebar and navbar items.
 * Both components read this config — no code changes needed.
 */
import { LayoutDashboard, Settings, Blocks, Bot, UserCircle, LogOut } from 'lucide-react';
import type { ComponentType } from 'react';

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  /** Restrict visibility to these roles (empty array or omitted = visible to all) */
  roles?: string[];
  /** Render a visual divider before this item */
  divider?: boolean;
  /** Where this item appears: 'navbar', 'sidebar', or 'both' (default) */
  showIn?: 'navbar' | 'sidebar' | 'both';
}

export interface UserMenuItem {
  label: string;
  /** Navigable link destination */
  href?: string;
  /** Built-in action identifier (e.g. 'logout') */
  action?: 'logout';
  icon?: ComponentType<{ className?: string; size?: number }>;
  /** Render a visual divider before this item */
  divider?: boolean;
}

export const navigationItems: NavItem[] = [
  {
    href: '/home',
    label: 'Home',
    icon: LayoutDashboard,
  },
  {
    href: '/ui',
    label: 'UI Showcase',
    icon: Blocks,
  },
  {
    href: '/ai-builder',
    label: 'AI Builder',
    icon: Bot,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    divider: true,
    roles: ['admin', 'superadmin'],
  },
];

/**
 * User menu items displayed in the sidebar footer.
 * Add more entries here (e.g. "App Library", "Manage Clients") to extend the menu.
 */
export const userMenuItems: UserMenuItem[] = [
  { label: 'Profile', href: '/settings', icon: UserCircle },
  { label: 'Sign out', action: 'logout', icon: LogOut, divider: true },
];

/**
 * Checks if a given route is "active" based on the current pathname.
 * Exact match for "/" and prefix match for everything else.
 */
export function isRouteActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}
