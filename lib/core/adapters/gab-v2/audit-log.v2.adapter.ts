import type { IAuthPort } from '../../ports/auth.port';
import type {
  AuditLogEntry,
  AuditLogPage,
  AuditLogQuery,
  IGabAuditLogRepository,
} from '../../ports/audit-log.repository';
import { GabV2Http } from './_http';

function normalizeEntry(raw: any): AuditLogEntry {
  return {
    id: String(raw.id ?? ''),
    userId: raw.userId ?? null,
    userEmail: raw.userEmail ?? null,
    action: String(raw.action ?? ''),
    tableId: raw.tableId ?? null,
    recordId: raw.recordId ?? null,
    changes: raw.changes ?? null,
    ipAddress: raw.ipAddress ?? null,
    impersonating: Boolean(raw.impersonating),
    entityType: raw.entityType ?? null,
    entityId: raw.entityId ?? null,
    createdAt: String(raw.createdAt ?? ''),
  };
}

function buildQs(query: AuditLogQuery): string {
  const sp = new URLSearchParams();
  if (query.action) sp.append('action', query.action);
  if (query.tableId) sp.append('tableId', query.tableId);
  if (query.from) sp.append('from', query.from);
  if (query.to) sp.append('to', query.to);
  if (query.page != null) sp.append('page', String(query.page));
  if (query.pageSize != null) sp.append('pageSize', String(query.pageSize));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

function toPage(res: any, fallbackPage: number, fallbackPageSize: number): AuditLogPage {
  const entries = Array.isArray(res?.entries)
    ? res.entries
    : Array.isArray(res?.items)
      ? res.items
      : [];
  return {
    entries: entries.map(normalizeEntry),
    total: Number(res?.total ?? entries.length),
    page: Number(res?.page ?? fallbackPage),
    pageSize: Number(res?.pageSize ?? fallbackPageSize),
  };
}

export class GabAuditLogV2Adapter implements IGabAuditLogRepository {
  private readonly http: GabV2Http;

  constructor(authPort: IAuthPort, apiUrl: string) {
    this.http = new GabV2Http(authPort, apiUrl);
  }

  async listAppAudit(
    appId: string,
    query: AuditLogQuery = {},
  ): Promise<AuditLogPage> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/audit-log${buildQs(query)}`,
    );
    return toPage(res, query.page ?? 1, query.pageSize ?? 25);
  }

  async listTableAudit(
    appId: string,
    tableId: string,
    query: AuditLogQuery = {},
  ): Promise<AuditLogPage> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/tables/${tableId}/audit-log${buildQs(query)}`,
    );
    return toPage(res, query.page ?? 1, query.pageSize ?? 25);
  }

  async getEntry(appId: string, id: string): Promise<AuditLogEntry> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/audit-log/${id}`,
    );
    return normalizeEntry(res);
  }
}
