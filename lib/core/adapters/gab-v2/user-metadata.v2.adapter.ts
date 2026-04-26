import type { IAuthPort } from '../../ports/auth.port';
import type {
  CreateMetadataFieldPayload,
  IGabUserMetadataRepository,
  MetadataField,
  UserMetadata,
  UserMetadataFieldType,
} from '../../ports/user-metadata.repository';
import { GabV2Http } from './_http';

const VALID_TYPES: UserMetadataFieldType[] = [
  'text',
  'number',
  'select',
  'boolean',
  'date',
];

function normalizeFieldType(raw: unknown): UserMetadataFieldType {
  return VALID_TYPES.includes(raw as UserMetadataFieldType)
    ? (raw as UserMetadataFieldType)
    : 'text';
}

function normalizeField(raw: unknown): MetadataField {
  const r = (raw ?? {}) as Record<string, unknown>;
  const opts = Array.isArray(r.options) ? (r.options as unknown[]) : undefined;
  return {
    id: String(r.id ?? ''),
    appId: String(r.appId ?? ''),
    fieldName: String(r.fieldName ?? ''),
    fieldType: normalizeFieldType(r.fieldType),
    options: opts ? opts.map((o) => String(o)) : undefined,
    required: Boolean(r.required),
    createdAt: r.createdAt ? String(r.createdAt) : undefined,
  };
}

function normalizeUserMetadata(
  raw: unknown,
  fallback: { appId: string; userId: string },
): UserMetadata {
  const r = (raw ?? {}) as Record<string, unknown>;
  const md = (r.metadata ?? {}) as Record<string, unknown>;
  return {
    userId: String(r.userId ?? fallback.userId),
    appId: String(r.appId ?? fallback.appId),
    metadata: md && typeof md === 'object' ? md : {},
  };
}

export class GabUserMetadataV2Adapter implements IGabUserMetadataRepository {
  private readonly http: GabV2Http;

  constructor(authPort: IAuthPort, apiUrl: string) {
    this.http = new GabV2Http(authPort, apiUrl);
  }

  async listFields(
    appId: string,
  ): Promise<{ items: MetadataField[]; total: number }> {
    const res = await this.http.json<{ items?: unknown[]; total?: number }>(
      `/v2/apps/${appId}/user-metadata-fields`,
    );
    const items = Array.isArray(res?.items) ? res.items.map(normalizeField) : [];
    return { items, total: typeof res?.total === 'number' ? res.total : items.length };
  }

  async createField(
    appId: string,
    payload: CreateMetadataFieldPayload,
  ): Promise<MetadataField> {
    const res = await this.http.json<unknown>(
      `/v2/apps/${appId}/user-metadata-fields`,
      { method: 'POST', body: JSON.stringify(payload) },
    );
    return normalizeField(res);
  }

  async deleteField(appId: string, fieldId: string): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/apps/${appId}/user-metadata-fields/${fieldId}`, {
      method: 'DELETE',
    });
    return { ok: true };
  }

  async getUserMetadata(appId: string, userId: string): Promise<UserMetadata> {
    const res = await this.http.json<unknown>(
      `/v2/apps/${appId}/users/${userId}/metadata`,
    );
    return normalizeUserMetadata(res, { appId, userId });
  }

  async patchUserMetadata(
    appId: string,
    userId: string,
    metadata: Record<string, unknown>,
  ): Promise<UserMetadata> {
    const res = await this.http.json<unknown>(
      `/v2/apps/${appId}/users/${userId}/metadata`,
      { method: 'PATCH', body: JSON.stringify(metadata) },
    );
    return normalizeUserMetadata(res, { appId, userId });
  }
}
