/**
 * Audit log port — read-only access to V2's app-scoped audit history.
 *
 * V2 query parameters supported by both `listAppAudit` and `listTableAudit`:
 *   - action      e.g. 'create' | 'update' | 'delete' | string
 *   - tableId     scope to a specific table (top-level only)
 *   - from / to   ISO-8601 date strings
 *   - page / pageSize
 *
 * V2 does NOT expose a user filter on the app-level endpoint. The UI
 * intentionally hides it.
 */

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  /** e.g. 'record.create', 'schema.table.update', 'role.assign'. */
  action: string;
  tableId: string | null;
  recordId: string | null;
  /** Free-form diff/changes payload from the backend. */
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  /** True when an admin/impersonation token was used. */
  impersonating: boolean;
  /** e.g. 'record', 'table', 'field', 'role'. */
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
}

export interface AuditLogQuery {
  action?: string;
  tableId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogPage {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IGabAuditLogRepository {
  listAppAudit(appId: string, query?: AuditLogQuery): Promise<AuditLogPage>;
  listTableAudit(
    appId: string,
    tableId: string,
    query?: AuditLogQuery,
  ): Promise<AuditLogPage>;
  getEntry(appId: string, id: string): Promise<AuditLogEntry>;
}
