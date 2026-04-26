/**
 * User-metadata port — per-app extension of the user record. Each app
 * defines a small schema of additional fields (e.g. employee number,
 * department) and stores per-user values for them. Mirrors GAB Core's
 * `/apps/:appId/user-metadata-fields` + `/apps/:appId/users/:id/metadata`
 * pair.
 *
 * Adapter selection is wired in the composition root. Removing the
 * feature later is one folder + one port deletion (the `ModulePath`
 * compile-time check catches dangling references).
 */

export type UserMetadataFieldType = 'text' | 'number' | 'select' | 'boolean' | 'date';

export interface MetadataField {
  id: string;
  appId: string;
  fieldName: string;
  fieldType: UserMetadataFieldType;
  options?: string[];
  required?: boolean;
  createdAt?: string;
}

export interface CreateMetadataFieldPayload {
  fieldName: string;
  fieldType: UserMetadataFieldType;
  options?: string[];
  required?: boolean;
}

export interface UserMetadata {
  userId: string;
  appId: string;
  metadata: Record<string, unknown>;
}

export interface IGabUserMetadataRepository {
  listFields(appId: string): Promise<{ items: MetadataField[]; total: number }>;
  createField(
    appId: string,
    payload: CreateMetadataFieldPayload,
  ): Promise<MetadataField>;
  deleteField(appId: string, fieldId: string): Promise<{ ok: boolean }>;

  getUserMetadata(appId: string, userId: string): Promise<UserMetadata>;
  patchUserMetadata(
    appId: string,
    userId: string,
    metadata: Record<string, unknown>,
  ): Promise<UserMetadata>;
}
