/**
 * In-memory dashboards adapter.
 *
 * Stand-in for `GabDashboardV2Adapter` until the V2 backend implements
 * `/v2/apps/:appId/dashboards`. Stores everything in module-scope maps
 * so dashboards survive page navigation but reset on server reload.
 *
 * Selected via the composition root when `USE_MEMORY_DASHBOARDS=true`.
 */

import type {
  CreateDashboardPayload,
  Dashboard,
  IGabDashboardRepository,
  UpdateDashboardPayload,
} from '../../ports/dashboard.repository';
import type { PageLayout } from '../../ports/pages.repository';

const EMPTY_LAYOUT: PageLayout = { type: 'grid', rows: [] };

const store = new Map<string, Map<string, Dashboard>>();

function getAppMap(appId: string): Map<string, Dashboard> {
  let m = store.get(appId);
  if (!m) {
    m = new Map<string, Dashboard>();
    store.set(appId, m);
  }
  return m;
}

function uid(): string {
  return `dash_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export class GabDashboardMemoryAdapter implements IGabDashboardRepository {
  async listDashboards(
    appId: string,
  ): Promise<{ items: Dashboard[]; total: number }> {
    const items = Array.from(getAppMap(appId).values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    return { items, total: items.length };
  }

  async getDashboard(appId: string, dashboardId: string): Promise<Dashboard> {
    const found = getAppMap(appId).get(dashboardId);
    if (!found) throw new Error(`Dashboard ${dashboardId} not found`);
    return found;
  }

  async getLayout(appId: string, dashboardId: string): Promise<PageLayout> {
    const dash = await this.getDashboard(appId, dashboardId);
    return dash.layout;
  }

  async createDashboard(
    appId: string,
    payload: CreateDashboardPayload,
  ): Promise<Dashboard> {
    const id = uid();
    const dash: Dashboard = {
      id,
      key: id,
      name: payload.name,
      description: payload.description,
      appId,
      layout: payload.layout ?? EMPTY_LAYOUT,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    getAppMap(appId).set(id, dash);
    return dash;
  }

  async updateDashboard(
    appId: string,
    dashboardId: string,
    patch: UpdateDashboardPayload,
  ): Promise<Dashboard> {
    const existing = await this.getDashboard(appId, dashboardId);
    const next: Dashboard = {
      ...existing,
      ...patch,
      layout: patch.layout ?? existing.layout,
      updatedAt: nowIso(),
    };
    getAppMap(appId).set(dashboardId, next);
    return next;
  }

  async deleteDashboard(
    appId: string,
    dashboardId: string,
  ): Promise<{ ok: boolean }> {
    getAppMap(appId).delete(dashboardId);
    return { ok: true };
  }
}
