/**
 * Table port — per-app data tables.
 *
 * GAB Core stores table schema in the per-app PostgreSQL database. Records
 * (rows) are accessed via {@link IGabDataRepository}; this port covers
 * table definition + recompute orchestration.
 */

export interface GabTable {
  id: string;
  key: string;
  name: string;
  slug?: string;
  appId: string;
  /** Primary key field id (the user-chosen "key field"). Optional. */
  keyFieldId?: string | null;
  createdAt?: string;
}

export interface CreateTablePayload {
  name: string;
  /** When true, server creates a default form + report alongside the table. */
  createReportAndForm?: boolean;
  /** Optional Lucide icon name for the table tile. */
  icon?: string;
}

export interface UpdateTablePayload {
  name?: string;
  keyFieldId?: string | null;
  icon?: string;
}

// ---------------------------------------------------------------------------
// Recompute (recalculate all computed fields across the app)
// ---------------------------------------------------------------------------

export interface RecomputeProgress {
  status: 'idle' | 'running' | 'completed' | 'failed';
  tablesCompleted: number;
  totalTables: number;
  recordsProcessed: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface IGabTableRepository {
  listTables(appId: string): Promise<{ items: GabTable[]; total: number }>;
  getTable(appId: string, tableId: string): Promise<GabTable>;
  createTable(appId: string, payload: CreateTablePayload): Promise<GabTable>;
  updateTable(
    appId: string,
    tableId: string,
    payload: UpdateTablePayload,
  ): Promise<GabTable>;
  deleteTable(appId: string, tableId: string): Promise<{ ok: boolean }>;
  /**
   * Kick off a full recompute of every computed field in the app. Returns
   * either an immediate summary (`{ tables, records }`) or a progress handle
   * that the caller can poll via {@link recomputeStatus}.
   */
  recomputeAll(
    appId: string,
  ): Promise<RecomputeProgress | { tables: number; records: number }>;
  recomputeStatus(appId: string): Promise<RecomputeProgress>;
}
