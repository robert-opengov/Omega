/**
 * In-memory user-metadata adapter — stand-in for `GabUserMetadataV2Adapter`
 * until the V2 backend implements `/apps/:appId/user-metadata-fields` and
 * `/apps/:appId/users/:userId/metadata`. Process-local maps mean state
 * survives navigation but resets on server reload.
 *
 * Selected via the composition root when `USE_MEMORY_USER_METADATA=true`.
 */

import type {
  CreateMetadataFieldPayload,
  IGabUserMetadataRepository,
  MetadataField,
  UserMetadata,
} from '../../ports/user-metadata.repository';

const fieldStore = new Map<string, Map<string, MetadataField>>();
const metaStore = new Map<string, Map<string, UserMetadata>>();

function getFieldMap(appId: string): Map<string, MetadataField> {
  let m = fieldStore.get(appId);
  if (!m) {
    m = new Map();
    fieldStore.set(appId, m);
  }
  return m;
}

function getMetaMap(appId: string): Map<string, UserMetadata> {
  let m = metaStore.get(appId);
  if (!m) {
    m = new Map();
    metaStore.set(appId, m);
  }
  return m;
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export class GabUserMetadataMemoryAdapter implements IGabUserMetadataRepository {
  async listFields(
    appId: string,
  ): Promise<{ items: MetadataField[]; total: number }> {
    const items = Array.from(getFieldMap(appId).values()).sort((a, b) =>
      a.fieldName.localeCompare(b.fieldName),
    );
    return { items, total: items.length };
  }

  async createField(
    appId: string,
    payload: CreateMetadataFieldPayload,
  ): Promise<MetadataField> {
    const id = uid('mf');
    const field: MetadataField = {
      id,
      appId,
      fieldName: payload.fieldName,
      fieldType: payload.fieldType,
      options: payload.options,
      required: Boolean(payload.required),
      createdAt: new Date().toISOString(),
    };
    getFieldMap(appId).set(id, field);
    return field;
  }

  async deleteField(appId: string, fieldId: string): Promise<{ ok: boolean }> {
    getFieldMap(appId).delete(fieldId);
    return { ok: true };
  }

  async getUserMetadata(appId: string, userId: string): Promise<UserMetadata> {
    const existing = getMetaMap(appId).get(userId);
    return existing ?? { appId, userId, metadata: {} };
  }

  async patchUserMetadata(
    appId: string,
    userId: string,
    metadata: Record<string, unknown>,
  ): Promise<UserMetadata> {
    const map = getMetaMap(appId);
    const existing = map.get(userId);
    const next: UserMetadata = {
      appId,
      userId,
      metadata: { ...(existing?.metadata ?? {}), ...metadata },
    };
    map.set(userId, next);
    return next;
  }
}
