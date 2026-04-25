import type { IAuthPort } from '../../ports/auth.port';
import type {
  CreateReportPayload,
  IGabReportRepository,
  Report,
  ReportType,
  UpdateReportPayload,
} from '../../ports/report.repository';
import { GabV2Http } from './_http';

const REPORT_TYPES: readonly ReportType[] = [
  'datatable',
  'chart',
  'calendar',
  'gantt',
  'pivot',
];

function normalizeType(raw: unknown): ReportType | undefined {
  if (typeof raw !== 'string') return undefined;
  return (REPORT_TYPES as readonly string[]).includes(raw)
    ? (raw as ReportType)
    : undefined;
}

function normalizeReport(raw: any): Report {
  return {
    id: String(raw?.id ?? ''),
    key: String(raw?.key ?? raw?.id ?? ''),
    name: String(raw?.name ?? ''),
    type: normalizeType(raw?.type),
    tableId: raw?.tableId ? String(raw.tableId) : undefined,
    appId: String(raw?.appId ?? ''),
    config:
      raw?.config && typeof raw.config === 'object'
        ? (raw.config as Record<string, unknown>)
        : undefined,
    createdAt: raw?.createdAt ? String(raw.createdAt) : undefined,
  };
}

export class GabReportV2Adapter implements IGabReportRepository {
  private readonly http: GabV2Http;

  constructor(authPort: IAuthPort, apiUrl: string) {
    this.http = new GabV2Http(authPort, apiUrl);
  }

  async listReports(appId: string): Promise<Report[]> {
    const res = await this.http.json<{ items?: any[] }>(
      `/v2/apps/${appId}/reports`,
    );
    return Array.isArray(res?.items) ? res.items.map(normalizeReport) : [];
  }

  async getReport(appId: string, reportId: string): Promise<Report> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/reports/${reportId}`,
    );
    return normalizeReport(res);
  }

  async createReport(
    appId: string,
    payload: CreateReportPayload,
  ): Promise<Report> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/reports`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeReport(res);
  }

  async updateReport(
    appId: string,
    reportId: string,
    patch: UpdateReportPayload,
  ): Promise<Report> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/reports/${reportId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    );
    return normalizeReport(res);
  }

  async deleteReport(
    appId: string,
    reportId: string,
  ): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/apps/${appId}/reports/${reportId}`, {
      method: 'DELETE',
    });
    return { ok: true };
  }
}

export { normalizeReport };
