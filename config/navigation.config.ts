/**
 * Centralized navigation configuration.
 * AI or developer edits ONLY this array to control sidebar items.
 * The Sidebar component reads this config — no code changes needed.
 */
import { LayoutDashboard, Settings, Blocks, Bot } from 'lucide-react';
import type { ComponentType } from 'react';

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  /** Restrict visibility to these roles (empty array or omitted = visible to all) */
  roles?: string[];
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
 * Checks if a given route is "active" based on the current pathname.
 * Exact match for "/" and prefix match for everything else.
 */
export function isRouteActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}
