import type { IAuthPort } from '../../ports/auth.port';
import type {
  IGabTableRepository,
  GabTable,
  CreateTablePayload,
  UpdateTablePayload,
  RecomputeProgress,
} from '../../ports/table.repository';
import { GabV2Http } from './_http';

function normalize(raw: any): GabTable {
  return {
    id: String(raw.id ?? ''),
    key: String(raw.key ?? raw.id ?? ''),
    name: String(raw.name ?? ''),
    slug: raw.slug,
    appId: String(raw.appId ?? ''),
    keyFieldId: raw.keyFieldId ?? null,
    createdAt: raw.createdAt,
  };
}

export class GabTableV2Adapter implements IGabTableRepository {
  private readonly http: GabV2Http;

  constructor(authPort: IAuthPort, apiUrl: string) {
    this.http = new GabV2Http(authPort, apiUrl);
  }

  async listTables(appId: string): Promise<{ items: GabTable[]; total: number }> {
    const res = await this.http.json<{ items?: any[]; total?: number }>(
      `/v2/apps/${appId}/tables`,
    );
    return {
      items: Array.isArray(res?.items) ? res.items.map(normalize) : [],
      total: Number(res?.total ?? 0),
    };
  }

  async getTable(appId: string, tableId: string): Promise<GabTable> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/tables/${tableId}`);
    return normalize(res);
  }

  async createTable(appId: string, payload: CreateTablePayload): Promise<GabTable> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/tables`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalize(res);
  }

  async updateTable(
    appId: string,
    tableId: string,
    payload: UpdateTablePayload,
  ): Promise<GabTable> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/tables/${tableId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return normalize(res);
  }

  async deleteTable(appId: string, tableId: string): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/apps/${appId}/tables/${tableId}`, {
      method: 'DELETE',
    });
    return { ok: true };
  }

  async recomputeAll(
    appId: string,
  ): Promise<RecomputeProgress | { tables: number; records: number }> {
    return this.http.json(`/v2/apps/${appId}/tables/recompute-all`, {
      method: 'POST',
    });
  }

  async recomputeStatus(appId: string): Promise<RecomputeProgress> {
    return this.http.json(`/v2/apps/${appId}/tables/recompute-all/status`);
  }
}
