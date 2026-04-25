import type { IAuthPort } from '../../ports/auth.port';
import type {
  CreatePagePayload,
  GabPage,
  IGabPageRepository,
  PageLayout,
  UpdatePagePayload,
} from '../../ports/pages.repository';
import { GabV2Http } from './_http';

function isPageLayout(x: unknown): x is PageLayout {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return o.type === 'grid' && Array.isArray(o.rows);
}

function normalizeLayout(raw: unknown): PageLayout | Record<string, unknown> {
  if (isPageLayout(raw)) return raw;
  if (raw && typeof raw === 'object' && (raw as PageLayout).type === 'grid') {
    return raw as PageLayout;
  }
  return { type: 'grid', rows: [] };
}

function normalizePage(raw: any): GabPage {
  const layout = normalizeLayout(raw?.layout);
  const config =
    raw?.config && typeof raw.config === 'object' && !Array.isArray(raw.config)
      ? (raw.config as GabPage['config'])
      : {};
  return {
    id: String(raw?.id ?? ''),
    key: String(raw?.key ?? ''),
    name: String(raw?.name ?? ''),
    slug: String(raw?.slug ?? ''),
    icon: raw?.icon === null || raw?.icon === undefined ? null : String(raw.icon),
    layout,
    config,
    createdAt: String(raw?.created_at ?? raw?.createdAt ?? ''),
    updatedAt: String(raw?.updated_at ?? raw?.updatedAt ?? ''),
  };
}

export class GabPageV2Adapter implements IGabPageRepository {
  private readonly http: GabV2Http;

  constructor(authPort: IAuthPort, apiUrl: string) {
    this.http = new GabV2Http(authPort, apiUrl);
  }

  async listPages(appId: string): Promise<{ items: GabPage[]; total: number }> {
    const res = await this.http.json<{ items?: any[]; total?: number }>(
      `/v2/apps/${appId}/pages`,
    );
    const items = Array.isArray(res?.items) ? res.items.map(normalizePage) : [];
    return { items, total: typeof res?.total === 'number' ? res.total : items.length };
  }

  async getPage(appId: string, pageKey: string): Promise<GabPage> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/pages/${pageKey}`);
    return normalizePage(res);
  }

  async createPage(appId: string, payload: CreatePagePayload): Promise<GabPage> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/pages`, {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        slug: payload.slug,
        icon: payload.icon,
        layout: payload.layout,
        config: payload.config,
      }),
    });
    return normalizePage(res);
  }

  async updatePage(
    appId: string,
    pageKey: string,
    patch: UpdatePagePayload,
  ): Promise<GabPage> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/pages/${pageKey}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return normalizePage(res);
  }

  async deletePage(appId: string, pageKey: string): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/apps/${appId}/pages/${pageKey}`, { method: 'DELETE' });
    return { ok: true };
  }

  async duplicatePage(appId: string, pageKey: string): Promise<GabPage> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/pages/${pageKey}/duplicate`,
      { method: 'POST' },
    );
    return normalizePage(res);
  }
}

export { normalizePage, normalizeLayout };
