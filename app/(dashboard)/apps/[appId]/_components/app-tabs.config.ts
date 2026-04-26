/**
 * Per-app top-tab registry.
 *
 * Each tab declares the module it belongs to so it can be hidden when the
 * module is turned off in `config/modules.config.ts`. Removing a feature is
 * the same one-line operation in both the nav and the route guard, so they
 * never drift.
 *
 * Add a tab here ▶ guard the matching `page.tsx` with `featureGuard(...)` ▶
 * the link only shows when the feature is on AND direct URL access also 404s.
 */
import {
  Database,
  GitBranch,
  Users,
  Settings,
  LayoutDashboard,
  Boxes,
  Bell,
  Zap,
  ScrollText,
  ClipboardList,
  Workflow,
  BarChart3,
  LayoutTemplate,
  LayoutGrid,
  Component,
  type LucideIcon,
} from 'lucide-react';
import type { ModulePath } from '@/config/modules.config';

export interface AppTab {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Path resolver — receives the appId from the route. */
  href: (appId: string) => string;
  /**
   * Module gate. Tabs without a flag are always shown (e.g. Overview).
   * When the flag is off, both the link and the route are 404d.
   */
  feature?: ModulePath;
  /** Match this segment exactly, otherwise `startsWith` is used. */
  exact?: boolean;
}

export const APP_TABS: AppTab[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    href: (id) => `/apps/${id}`,
    feature: 'app.overview',
    exact: true,
  },
  {
    id: 'tables',
    label: 'Tables',
    icon: Database,
    href: (id) => `/apps/${id}/tables`,
    feature: 'app.tables',
  },
  {
    id: 'relationships',
    label: 'Relationships',
    icon: GitBranch,
    href: (id) => `/apps/${id}/relationships`,
    feature: 'app.relationships',
  },
  {
    id: 'roles',
    label: 'Roles',
    icon: Users,
    href: (id) => `/apps/${id}/roles`,
    feature: 'app.roles',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    href: (id) => `/apps/${id}/notifications`,
    feature: 'app.notifications',
  },
  {
    id: 'jobs',
    label: 'Jobs',
    icon: Zap,
    href: (id) => `/apps/${id}/jobs`,
    feature: 'app.jobs',
  },
  {
    id: 'audit',
    label: 'Audit',
    icon: ScrollText,
    href: (id) => `/apps/${id}/audit`,
    feature: 'app.audit',
  },
  {
    id: 'forms',
    label: 'Forms',
    icon: ClipboardList,
    href: (id) => `/apps/${id}/forms`,
    feature: 'app.forms',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    href: (id) => `/apps/${id}/reports`,
    feature: 'app.reports',
  },
  {
    id: 'pages',
    label: 'Pages',
    icon: LayoutTemplate,
    href: (id) => `/apps/${id}/pages`,
    feature: 'app.pages',
  },
  {
    id: 'dashboards',
    label: 'Dashboards',
    icon: LayoutGrid,
    href: (id) => `/apps/${id}/dashboards`,
    feature: 'app.dashboards',
  },
  {
    id: 'components',
    label: 'Components',
    icon: Component,
    href: (id) => `/apps/${id}/components`,
    feature: 'app.customComponents',
  },
  {
    id: 'workflows',
    label: 'Workflows',
    icon: Workflow,
    href: (id) => `/apps/${id}/workflows`,
    feature: 'app.workflows',
  },
  {
    id: 'sandbox',
    label: 'Sandbox',
    icon: Boxes,
    href: (id) => `/apps/${id}/sandbox`,
    feature: 'app.sandbox',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: (id) => `/apps/${id}/settings`,
    feature: 'app.settings',
  },
];
