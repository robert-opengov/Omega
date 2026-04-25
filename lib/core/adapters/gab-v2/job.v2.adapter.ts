import type { IAuthPort } from '../../ports/auth.port';
import type {
  FailedJob,
  IGabJobRepository,
  RecomputeProgress,
  TableJob,
} from '../../ports/job.repository';
import { GabV2Http } from './_http';

function normalizeFailed(raw: any): FailedJob {
  return {
    id: String(raw.id ?? ''),
    type: String(raw.type ?? raw.jobType ?? 'unknown'),
    payload: raw.payload ?? null,
    attempts: Number(raw.attempts ?? 0),
    error: raw.error ?? raw.lastError ?? null,
    failedAt: String(raw.failedAt ?? raw.updatedAt ?? raw.createdAt ?? ''),
    createdAt: String(raw.createdAt ?? ''),
  };
}

function normalizeProgress(raw: any): RecomputeProgress {
  return {
    status: String(raw?.status ?? 'idle'),
    progress: raw?.progress != null ? Number(raw.progress) : null,
    totalTables: raw?.totalTables != null ? Number(raw.totalTables) : null,
    completedTables: raw?.completedTables != null ? Number(raw.completedTables) : null,
    currentTableId: raw?.currentTableId ?? null,
    startedAt: raw?.startedAt ?? null,
    completedAt: raw?.completedAt ?? null,
    error: raw?.error ?? null,
  };
}

function normalizeTableJob(raw: any): TableJob {
  return {
    id: String(raw.id ?? ''),
    tableId: String(raw.tableId ?? ''),
    type: String(raw.type ?? raw.jobType ?? 'unknown'),
    status: String(raw.status ?? 'queued'),
    progress: raw.progress != null ? Number(raw.progress) : null,
    error: raw.error ?? null,
    startedAt: raw.startedAt ?? null,
    completedAt: raw.completedAt ?? null,
    createdAt: String(raw.createdAt ?? ''),
  };
}

export class GabJobV2Adapter implements IGabJobRepository {
  private readonly http: GabV2Http;

  constructor(authPort: IAuthPort, apiUrl: string) {
    this.http = new GabV2Http(authPort, apiUrl);
  }

  async listFailedJobs(appId: string): Promise<{ items: FailedJob[]; total: number }> {
    const res = await this.http.json<{ items?: any[]; total?: number }>(
      `/v2/apps/${appId}/failed-jobs`,
    );
    const items = Array.isArray(res?.items) ? res.items : [];
    return {
      items: items.map(normalizeFailed),
      total: Number(res?.total ?? items.length),
    };
  }

  async retryFailedJob(appId: string, jobId: string): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/apps/${appId}/failed-jobs/${jobId}/retry`, {
      method: 'POST',
    });
    return { ok: true };
  }

  async deleteFailedJob(appId: string, jobId: string): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/apps/${appId}/failed-jobs/${jobId}`, {
      method: 'DELETE',
    });
    return { ok: true };
  }

  async clearFailedJobs(appId: string): Promise<{ ok: boolean; cleared: number }> {
    const res = await this.http.json<{ cleared?: number }>(
      `/v2/apps/${appId}/failed-jobs`,
      { method: 'DELETE' },
    );
    return { ok: true, cleared: Number(res?.cleared ?? 0) };
  }

  async recomputeAll(appId: string): Promise<{ jobId?: string; status?: string }> {
    const res = await this.http.json<{ jobId?: string; status?: string }>(
      `/v2/apps/${appId}/tables/recompute-all`,
      { method: 'POST' },
    );
    return {
      jobId: res?.jobId ? String(res.jobId) : undefined,
      status: res?.status ? String(res.status) : undefined,
    };
  }

  async getRecomputeStatus(appId: string): Promise<RecomputeProgress> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/tables/recompute-all/status`,
    );
    return normalizeProgress(res);
  }

  async getTableJob(appId: string, tableId: string, jobId: string): Promise<TableJob> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/tables/${tableId}/jobs/${jobId}`,
    );
    return normalizeTableJob(res);
  }
}
