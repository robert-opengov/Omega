import type { IAuthPort } from '../../ports/auth.port';
import type {
  IGabAppRepository,
  GabApp,
  CreateAppPayload,
  UpdateAppPayload,
  CopyAppPayload,
  ComplexityScore,
  DependencyGraph,
} from '../../ports/app.repository';
import { GabV2Http } from './_http';

function normalizeApp(raw: any): GabApp {
  return {
    id: String(raw.id ?? ''),
    key: String(raw.key ?? raw.id ?? ''),
    name: String(raw.name ?? ''),
    slug: raw.slug,
    description: raw.description ?? null,
    companyId: raw.companyId,
    sandboxOf: raw.sandboxOf ?? null,
    sandboxIncludeData: raw.sandboxIncludeData ?? null,
    schemaLockedAt: raw.schemaLockedAt ?? null,
    timezone: raw.timezone,
    navigation: raw.navigation,
    tenantName: raw.tenantName ?? null,
    tenantId: raw.tenantId,
    createdAt: raw.createdAt,
  };
}

export class GabAppV2Adapter implements IGabAppRepository {
  private readonly http: GabV2Http;

  constructor(authPort: IAuthPort, apiUrl: string) {
    this.http = new GabV2Http(authPort, apiUrl);
  }

  async listApps(companyId?: string): Promise<{ items: GabApp[]; total: number }> {
    const qs = GabV2Http.qs({ companyId });
    const res = await this.http.json<{ items?: any[]; total?: number }>(
      `/v2/apps${qs}`,
    );
    return {
      items: Array.isArray(res?.items) ? res.items.map(normalizeApp) : [],
      total: Number(res?.total ?? 0),
    };
  }

  async getApp(appId: string): Promise<GabApp> {
    const res = await this.http.json<any>(`/v2/apps/${appId}`);
    return normalizeApp(res);
  }

  async createApp(payload: CreateAppPayload): Promise<GabApp> {
    const res = await this.http.json<any>('/v2/apps', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeApp(res);
  }

  async updateApp(appId: string, payload: UpdateAppPayload): Promise<GabApp> {
    const res = await this.http.json<any>(`/v2/apps/${appId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return normalizeApp(res);
  }

  async deleteApp(appId: string): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/apps/${appId}`, { method: 'DELETE' });
    return { ok: true };
  }

  async copyApp(appId: string, payload: CopyAppPayload): Promise<GabApp> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/copy`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeApp(res);
  }

  async getComplexityScore(appId: string): Promise<ComplexityScore> {
    return this.http.json<ComplexityScore>(
      `/v2/apps/${appId}/app/complexity-score`,
    );
  }

  async getDependencyGraph(appId: string): Promise<DependencyGraph> {
    return this.http.json<DependencyGraph>(
      `/v2/apps/${appId}/dependency-graph`,
    );
  }
}
