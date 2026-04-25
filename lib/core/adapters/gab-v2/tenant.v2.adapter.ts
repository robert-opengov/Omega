import type { IAuthPort } from '../../ports/auth.port';
import type {
  IGabTenantRepository,
  GabTenant,
  CreateTenantPayload,
  UpdateTenantPayload,
} from '../../ports/tenant.repository';
import { GabV2Http } from './_http';

function normalize(raw: any): GabTenant {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    slug: raw.slug,
    createdAt: raw.createdAt,
  };
}

export class GabTenantV2Adapter implements IGabTenantRepository {
  private readonly http: GabV2Http;

  constructor(authPort: IAuthPort, apiUrl: string) {
    this.http = new GabV2Http(authPort, apiUrl);
  }

  async listTenants(): Promise<{ items: GabTenant[]; total: number }> {
    const res = await this.http.json<{ items?: any[]; total?: number }>(
      '/v2/companies',
    );
    return {
      items: Array.isArray(res?.items) ? res.items.map(normalize) : [],
      total: Number(res?.total ?? 0),
    };
  }

  async getTenant(tenantId: string): Promise<GabTenant> {
    const res = await this.http.json<any>(`/v2/companies/${tenantId}`);
    return normalize(res);
  }

  async createTenant(payload: CreateTenantPayload): Promise<GabTenant> {
    const res = await this.http.json<any>('/v2/companies', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalize(res);
  }

  async updateTenant(tenantId: string, payload: UpdateTenantPayload): Promise<GabTenant> {
    const res = await this.http.json<any>(`/v2/companies/${tenantId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return normalize(res);
  }
}
