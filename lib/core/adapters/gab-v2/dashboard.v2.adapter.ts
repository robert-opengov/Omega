import type { IAuthPort } from '../../ports/auth.port';
import type {
  CreateDashboardPayload,
  Dashboard,
  IGabDashboardRepository,
  UpdateDashboardPayload,
} from '../../ports/dashboard.repository';
import type { PageLayout } from '../../ports/pages.repository';
import { GabV2Http } from './_http';

const EMPTY_LAYOUT: PageLayout = { type: 'grid', rows: [] };

function normalizeLayout(raw: unknown): PageLayout {
  if (raw && typeof raw === 'object' && 'rows' in (raw as Record<string, unknown>)) {
    return raw as PageLayout;
  }
  return EMPTY_LAYOUT;
}

function normalizeDashboard(raw: unknown): Dashboard {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    key: String(r.key ?? r.id ?? ''),
    name: String(r.name ?? ''),
    description: r.description ? String(r.description) : undefined,
    appId: String(r.appId ?? ''),
    layout: normalizeLayout(r.layout),
    createdAt: r.createdAt ? String(r.createdAt) : undefined,
    updatedAt: r.updatedAt ? String(r.updatedAt) : undefined,
  };
}

export class GabDashboardV2Adapter implements IGabDashboardRepository {
  private readonly http: GabV2Http;

  constructor(authPort: IAuthPort, apiUrl: string) {
    this.http = new GabV2Http(authPort, apiUrl);
  }

  async listDashboards(
    appId: string,
  ): Promise<{ items: Dashboard[]; total: number }> {
    const res = await this.http.json<{ items?: unknown[]; total?: number }>(
      `/v2/apps/${appId}/dashboards`,
    );
    const items = Array.isArray(res?.items) ? res.items.map(normalizeDashboard) : [];
    return { items, total: typeof res?.total === 'number' ? res.total : items.length };
  }

  async getDashboard(appId: string, dashboardId: string): Promise<Dashboard> {
    const res = await this.http.json<unknown>(
      `/v2/apps/${appId}/dashboards/${dashboardId}`,
    );
    return normalizeDashboard(res);
  }

  async getLayout(appId: string, dashboardId: string): Promise<PageLayout> {
    const dash = await this.getDashboard(appId, dashboardId);
    return dash.layout;
  }

  async createDashboard(
    appId: string,
    payload: CreateDashboardPayload,
  ): Promise<Dashboard> {
    const res = await this.http.json<unknown>(`/v2/apps/${appId}/dashboards`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeDashboard(res);
  }

  async updateDashboard(
    appId: string,
    dashboardId: string,
    patch: UpdateDashboardPayload,
  ): Promise<Dashboard> {
    const res = await this.http.json<unknown>(
      `/v2/apps/${appId}/dashboards/${dashboardId}`,
      { method: 'PATCH', body: JSON.stringify(patch) },
    );
    return normalizeDashboard(res);
  }

  async deleteDashboard(
    appId: string,
    dashboardId: string,
  ): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/apps/${appId}/dashboards/${dashboardId}`, {
      method: 'DELETE',
    });
    return { ok: true };
  }
}
