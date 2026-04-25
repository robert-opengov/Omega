'use server';

import { gabAuditLogRepo } from '@/lib/core';
import type {
  AuditLogEntry,
  AuditLogPage,
  AuditLogQuery,
} from '@/lib/core/ports/audit-log.repository';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function fail<T>(label: string, err: unknown): ActionResult<T> {
  const message = err instanceof Error ? err.message : `Failed: ${label}`;
  console.error(`${label} error:`, message);
  return { success: false, error: message };
}

export async function listAppAuditAction(
  appId: string,
  query?: AuditLogQuery,
): Promise<ActionResult<AuditLogPage>> {
  try {
    return { success: true, data: await gabAuditLogRepo.listAppAudit(appId, query) };
  } catch (err) {
    return fail('listAppAuditAction', err);
  }
}

export async function listTableAuditAction(
  appId: string,
  tableId: string,
  query?: AuditLogQuery,
): Promise<ActionResult<AuditLogPage>> {
  try {
    return { success: true, data: await gabAuditLogRepo.listTableAudit(appId, tableId, query) };
  } catch (err) {
    return fail('listTableAuditAction', err);
  }
}

export async function getAuditEntryAction(
  appId: string,
  id: string,
): Promise<ActionResult<AuditLogEntry>> {
  try {
    return { success: true, data: await gabAuditLogRepo.getEntry(appId, id) };
  } catch (err) {
    return fail('getAuditEntryAction', err);
  }
}
