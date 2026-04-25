import type { IAuthPort } from '../../ports/auth.port';
import type {
  IGabRelationshipRepository,
  GabRelationship,
  CreateRelationshipPayload,
  UpdateRelationshipPayload,
} from '../../ports/relationship.repository';
import { GabV2Http } from './_http';

function normalize(raw: any): GabRelationship {
  return {
    id: String(raw.id ?? ''),
    parentTableId: String(raw.parentTableId ?? ''),
    childTableId: String(raw.childTableId ?? ''),
    parentTableKey: raw.parentTableKey,
    childTableKey: raw.childTableKey,
    parentFieldId: raw.parentFieldId ?? null,
    childFieldId: raw.childFieldId ?? null,
    childFkField: String(raw.childFkField ?? ''),
    type: String(raw.type ?? ''),
    autoCreatedFk: Boolean(raw.autoCreatedFk),
    createdAt: raw.createdAt,
  };
}

export class GabRelationshipV2Adapter implements IGabRelationshipRepository {
  private readonly http: GabV2Http;

  constructor(authPort: IAuthPort, apiUrl: string) {
    this.http = new GabV2Http(authPort, apiUrl);
  }

  async listRelationships(
    appId: string,
    tableId?: string,
  ): Promise<{ items: GabRelationship[]; total: number }> {
    const qs = GabV2Http.qs({ tableId });
    const res = await this.http.json<{ items?: any[]; total?: number }>(
      `/v2/apps/${appId}/relationships${qs}`,
    );
    return {
      items: Array.isArray(res?.items) ? res.items.map(normalize) : [],
      total: Number(res?.total ?? 0),
    };
  }

  async createRelationship(
    appId: string,
    payload: CreateRelationshipPayload,
  ): Promise<GabRelationship> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/relationships`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalize(res);
  }

  async updateRelationship(
    appId: string,
    relationshipId: string,
    payload: UpdateRelationshipPayload,
  ): Promise<GabRelationship> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/relationships/${relationshipId}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
    );
    return normalize(res);
  }

  async deleteRelationship(
    appId: string,
    relationshipId: string,
  ): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/apps/${appId}/relationships/${relationshipId}`, {
      method: 'DELETE',
    });
    return { ok: true };
  }
}
