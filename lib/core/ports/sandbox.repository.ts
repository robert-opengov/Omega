/**
 * Sandbox port — schema staging environments.
 *
 * Workflow: create a sandbox of a production app, edit schema in the sandbox,
 * diff vs production, then promote selected changes back to prod.
 */

export interface SchemaDiffEntry {
  added: Array<Record<string, unknown>>;
  modified: Array<{
    key: string;
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  }>;
  removed: Array<Record<string, unknown>>;
}

export interface SchemaDiff {
  tables: SchemaDiffEntry;
  fields: SchemaDiffEntry;
  relationships: SchemaDiffEntry;
  forms: SchemaDiffEntry;
  reports: SchemaDiffEntry;
  workflows: SchemaDiffEntry;
  pages: SchemaDiffEntry;
  notifications: SchemaDiffEntry;
  customComponents: SchemaDiffEntry;
  roles: SchemaDiffEntry;
  rolePermissions: SchemaDiffEntry;
  roleFieldPermissions: SchemaDiffEntry;
  roleMgmtCapabilities: SchemaDiffEntry;
  statuses: SchemaDiffEntry;
  publicLinks: SchemaDiffEntry;
  userMetadataFields: SchemaDiffEntry;
  navigationChanged?: boolean;
}

export interface SchemaChangeSelector {
  category: string;
  action: string;
  key: string;
}

export interface SchemaBackup {
  id: string;
  appId: string;
  reason: string;
  createdAt: string;
}

export interface CreateSandboxPayload {
  name?: string;
  /** When true, copy production data into the sandbox database. */
  includeData?: boolean;
}

export interface PromoteSandboxPayload {
  /** When true, the sandbox is deleted after a successful promotion. */
  deleteSandbox?: boolean;
  /** Subset of changes to promote. Omit to promote everything. */
  selectedChanges?: SchemaChangeSelector[];
}

export interface IGabSandboxRepository {
  createSandbox(
    appId: string,
    payload: CreateSandboxPayload,
  ): Promise<{ appId: string; appKey: string; dbName: string }>;
  /** Compute the schema delta between a sandbox and its production parent. */
  getSandboxDiff(sandboxAppId: string): Promise<SchemaDiff>;
  promoteSandbox(
    sandboxAppId: string,
    payload: PromoteSandboxPayload,
  ): Promise<{ promoted: boolean }>;
  discardSandbox(sandboxAppId: string): Promise<{ discarded: boolean }>;
  /** List schema backups (auto-generated before each promotion). */
  listBackups(appId: string): Promise<{ items: SchemaBackup[] }>;
  /** Restore a backup. Pass `backupId=undefined` to roll back to the latest. */
  restoreBackup(
    appId: string,
    backupId?: string,
  ): Promise<{ rolledBack: boolean }>;
  /** Export the app schema as a JSON-serializable document. */
  exportSchema(appId: string): Promise<Record<string, unknown>>;
  /** Import a full app schema document. */
  importSchema(
    appId: string,
    payload: Record<string, unknown>,
  ): Promise<{ imported: boolean }>;
}
