/**
 * Centralized navigation configuration — single source of truth.
 *
 * Navbar, Sidebar, and CommandPalette all read from `navigationItems`.
 * Each consumer picks the fields it needs and ignores the rest:
 *   - Navbar uses `navbarLabel`, ignores `children`/`badge`/`group`.
 *   - Sidebar uses `children`, `badge`, `group`; ignores `navbarLabel`.
 *   - CommandPalette uses `flattenNavItems()` to get a searchable flat list.
 */
import { LayoutDashboard, Settings, Blocks, Bot, UserCircle, LogOut, AppWindow, Package, Building2, Users, ToggleRight, Database } from 'lucide-react';
import type { ComponentType } from 'react';
import type { AppFeatures } from '@/config/app.config';
import { isModuleEnabled } from '@/lib/features';
import { modulesConfig, type ModulePath, type ModulesConfig } from '@/config/modules.config';

export type NavIcon = ComponentType<{ className?: string; size?: number }>;

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;

  /** Restrict visibility to these roles (empty array or omitted = visible to all) */
  roles?: string[];
  /** Render a visual divider before this item */
  divider?: boolean;
  /** Where this item appears: 'navbar', 'sidebar', or 'both' (default) */
  showIn?: 'navbar' | 'sidebar' | 'both';
  /**
   * Only show this item when the given feature flag is enabled.
   * Accepts either:
   *   - a key from `appConfig.features` (cosmetic UI flag), or
   *   - a dotted-path module flag from `modulesConfig` (e.g. `platform.tenants`).
   * The helper `isFeatureEnabled` resolves both forms transparently.
   */
  featureFlag?: keyof AppFeatures | ModulePath;

  /** Nested sub-navigation items (rendered by Sidebar only) */
  children?: NavItem[];
  /** Notification count or status text (rendered by Sidebar only) */
  badge?: string | number;
  /** Section heading rendered above this item (Sidebar only) */
  group?: string;

  /** If set, Navbar renders this instead of `label` (compact top-bar labeling) */
  navbarLabel?: string;

  /**
   * Route access level — controls middleware behavior:
   * - `'protected'` (default) — requires authentication
   * - `'public'` — accessible without login
   *
   * NOTE: `roles` controls UI visibility only. Middleware-level role
   * enforcement requires a server-side check in the route handler.
   */
  access?: 'protected' | 'public';
}

export interface UserMenuItem {
  label: string;
  /** Navigable link destination */
  href?: string;
  /** Built-in action identifier (e.g. 'logout') */
  action?: 'logout';
  icon?: NavIcon;
  /** Render a visual divider before this item */
  divider?: boolean;
}

/**
 * Primary navigation registry — single source of truth.
 *
 * WHAT THIS CONTROLS:
 * - Which links appear in the Navbar, Sidebar, and CommandPalette
 * - Which route prefixes are auto-registered as protected (middleware)
 * - Feature-flag and role-based visibility filtering
 *
 * FIELD QUICK REFERENCE:
 * | Field         | Navbar | Sidebar | Middleware | Default     |
 * |---------------|--------|---------|-----------|-------------|
 * | showIn        | yes    | yes     | no        | 'both'      |
 * | navbarLabel   | yes    | no      | no        | label       |
 * | children      | no     | yes     | yes       | []          |
 * | badge         | no     | yes     | no        | undefined   |
 * | group         | no     | yes     | no        | undefined   |
 * | roles         | yes    | yes     | no*       | all roles   |
 * | featureFlag   | yes    | yes     | no        | always on   |
 * | access        | no     | no      | yes       | 'protected' |
 *
 * *roles hides the UI link but does NOT enforce at middleware level.
 *  Use server-side checks in route handlers for role enforcement.
 *
 * @example Different items per surface
 * { href: '/search', label: 'Search', icon: Search, showIn: 'navbar' }
 * { href: '/tools',  label: 'Tools',  icon: Wrench, showIn: 'sidebar' }
 *
 * @example Sidebar nesting with compact navbar label
 * {
 *   href: '/permitting',
 *   label: 'Permitting',
 *   navbarLabel: 'Permits',
 *   icon: FileText,
 *   group: 'Verticals',
 *   children: [
 *     { href: '/permitting/applications', label: 'Applications', icon: List, badge: 3 },
 *     { href: '/permitting/inspections', label: 'Inspections', icon: BarChart, showIn: 'sidebar' },
 *   ],
 * }
 *
 * @see {@link ./routes.config.ts} — derived middleware rules (auto-synced)
 */
export const navigationItems: NavItem[] = [
  {
    href: '/home',
    label: 'Home',
    icon: LayoutDashboard,
  },
  {
    href: '/apps',
    label: 'Apps',
    icon: AppWindow,
    group: 'GAB Core',
  },
  {
    href: '/templates',
    label: 'Templates',
    icon: Package,
    featureFlag: 'platform.templates',
  },
  {
    href: '/ui',
    label: 'UI Showcase',
    icon: Blocks,
    featureFlag: 'platform.uiShowcase',
  },
  {
    href: '/ai-builder',
    label: 'AI Builder',
    icon: Bot,
    featureFlag: 'platform.aiBuilder',
  },
  {
    href: '/companies',
    label: 'Companies',
    icon: Building2,
    group: 'Platform',
    divider: true,
    roles: ['admin', 'superadmin'],
    featureFlag: 'platform.tenants',
  },
  {
    href: '/users',
    label: 'Users',
    icon: Users,
    group: 'Platform',
    roles: ['admin', 'superadmin'],
    featureFlag: 'platform.users',
    children: [
      {
        href: '/users/metadata',
        label: 'Metadata',
        icon: Database,
        roles: ['admin', 'superadmin'],
        featureFlag: 'platform.userMetadata',
      },
    ],
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    divider: true,
    roles: ['admin', 'superadmin'],
  },
  {
    href: '/settings/modules',
    label: 'Module Flags',
    icon: ToggleRight,
    roles: ['admin', 'superadmin'],
    showIn: 'sidebar',
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

/**
 * Checks whether a nav item's feature flag (if any) is enabled.
 * Items without a `featureFlag` are always visible.
 *
 * Resolution order:
 *   1. If the flag matches a key in `AppFeatures` (cosmetic UI toggles),
 *      use that boolean.
 *   2. Otherwise treat it as a dotted module path. When `modules` is
 *      supplied (from `useModuleFlags()` — the effective tree with
 *      cookie overrides applied), resolve against it. Otherwise fall
 *      back to the static baseline so server-rendered code continues to
 *      work without an explicit modules tree.
 */
export function isFeatureEnabled(
  item: NavItem,
  features: AppFeatures,
  modules?: ModulesConfig,
): boolean {
  if (!item.featureFlag) return true;
  if (item.featureFlag in features) {
    return !!features[item.featureFlag as keyof AppFeatures];
  }
  if (modules) {
    const [cat, leaf] = item.featureFlag.split('.') as [keyof ModulesConfig, string];
    const group = modules[cat] as unknown as Record<string, boolean> | undefined;
    return Boolean(group?.[leaf]);
  }
  return isModuleEnabled(item.featureFlag);
}

/**
 * Recursively flattens nested `NavItem` trees into a single list,
 * filtering by feature flags and roles. Used by CommandPalette to
 * build a searchable index of all reachable nav destinations.
 */
export function flattenNavItems(
  items: NavItem[],
  features: AppFeatures,
  userRole?: string,
  modules?: ModulesConfig,
): NavItem[] {
  return items.flatMap((item) => {
    if (!isFeatureEnabled(item, features, modules)) return [];
    if (item.roles?.length && !item.roles.includes(userRole ?? '')) return [];
    return [item, ...flattenNavItems(item.children ?? [], features, userRole, modules)];
  });
}

// `modulesConfig` is re-exported indirectly via `isFeatureEnabled` callers;
// keep the import live so future refactors that drop the fallback don't
// have to re-import.
void modulesConfig;

/**
 * Extracts all route prefixes from the nav tree that require authentication.
 * Used by `routes.config.ts` to keep middleware in sync with navigation
 * automatically — no manual route registration needed.
 */
export function collectProtectedPrefixes(items: NavItem[]): string[] {
  return items.flatMap((item) => {
    const self = (item.access ?? 'protected') === 'protected' ? [item.href] : [];
    const nested = collectProtectedPrefixes(item.children ?? []);
    return [...self, ...nested];
  });
}
