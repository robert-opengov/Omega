/**
 * Jobs port — failed jobs queue and "recompute all" progress.
 *
 * GAB Core's `GET /v2/apps/:appId/jobs` is currently a stub returning `[]`,
 * so we deliberately omit a generic `listJobs` here and only expose the two
 * surfaces that have real implementations behind them.
 */

export interface FailedJob {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  attempts: number;
  error: string | null;
  failedAt: string;
  createdAt: string;
}

export interface RecomputeProgress {
  status: 'idle' | 'queued' | 'running' | 'completed' | 'failed' | string;
  /** Float 0..1 if known, otherwise null. */
  progress: number | null;
  totalTables: number | null;
  completedTables: number | null;
  currentTableId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
}

export interface TableJob {
  id: string;
  tableId: string;
  type: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | string;
  progress: number | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface IGabJobRepository {
  listFailedJobs(appId: string): Promise<{ items: FailedJob[]; total: number }>;
  retryFailedJob(appId: string, jobId: string): Promise<{ ok: boolean }>;
  deleteFailedJob(appId: string, jobId: string): Promise<{ ok: boolean }>;
  clearFailedJobs(appId: string): Promise<{ ok: boolean; cleared: number }>;
  recomputeAll(appId: string): Promise<{ jobId?: string; status?: string }>;
  getRecomputeStatus(appId: string): Promise<RecomputeProgress>;
  getTableJob(appId: string, tableId: string, jobId: string): Promise<TableJob>;
}
