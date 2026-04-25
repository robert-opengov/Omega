/**
 * Relationship port — typed links between two tables in the same app.
 *
 * GAB Core auto-creates an FK field on the child table when a relationship
 * is created. The `childFkField` property names that column.
 */

export interface GabRelationship {
  id: string;
  parentTableId: string;
  childTableId: string;
  parentTableKey?: string;
  childTableKey?: string;
  parentFieldId?: string | null;
  childFieldId?: string | null;
  /** Name of the FK column on the child table. */
  childFkField: string;
  /** "1:1" | "1:N" | "N:M" — adapter passes through unchanged. */
  type: string;
  /** True when the FK column was created automatically by GAB Core. */
  autoCreatedFk?: boolean;
  createdAt?: string;
}

export interface CreateRelationshipPayload {
  parentTableId: string;
  childTableId: string;
  type: string;
  /** Override the auto-generated FK column name. */
  childFkField?: string;
}

export interface UpdateRelationshipPayload {
  type?: string;
  childFkField?: string;
}

export interface IGabRelationshipRepository {
  /** List relationships in an app; optionally narrow to a single table. */
  listRelationships(
    appId: string,
    tableId?: string,
  ): Promise<{ items: GabRelationship[]; total: number }>;
  createRelationship(
    appId: string,
    payload: CreateRelationshipPayload,
  ): Promise<GabRelationship>;
  updateRelationship(
    appId: string,
    relationshipId: string,
    payload: UpdateRelationshipPayload,
  ): Promise<GabRelationship>;
  deleteRelationship(
    appId: string,
    relationshipId: string,
  ): Promise<{ ok: boolean }>;
}
