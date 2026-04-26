/**
 * Dashboard port — first-class composable surface for KPI tiles and
 * mini-charts. Mirrors GAB Core's incomplete `/v2/apps/:appId/dashboards`
 * contract.
 *
 * A dashboard owns a `layout` (re-using the page-builder grid shape) so
 * the existing renderer can show it without a separate widget stack. The
 * V2 backend may not implement the endpoints yet — adapter surfaces
 * 404/501 unchanged so the UI can degrade cleanly.
 */

import type { PageLayout } from './pages.repository';

export interface Dashboard {
  id: string;
  key: string;
  name: string;
  appId: string;
  description?: string;
  /** Layout reuses the page-builder grid so the same renderer works. */
  layout: PageLayout;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDashboardPayload {
  name: string;
  description?: string;
  layout?: PageLayout;
}

export type UpdateDashboardPayload = Partial<CreateDashboardPayload>;

export interface IGabDashboardRepository {
  listDashboards(appId: string): Promise<{ items: Dashboard[]; total: number }>;
  getDashboard(appId: string, dashboardId: string): Promise<Dashboard>;
  /**
   * Convenience accessor — returns just the layout shape so the viewer
   * can call this without round-tripping the full record. Defaults to
   * delegating to `getDashboard(...).layout` in adapters that don't have
   * a dedicated endpoint.
   */
  getLayout(appId: string, dashboardId: string): Promise<PageLayout>;
  createDashboard(
    appId: string,
    payload: CreateDashboardPayload,
  ): Promise<Dashboard>;
  updateDashboard(
    appId: string,
    dashboardId: string,
    patch: UpdateDashboardPayload,
  ): Promise<Dashboard>;
  deleteDashboard(
    appId: string,
    dashboardId: string,
  ): Promise<{ ok: boolean }>;
}
