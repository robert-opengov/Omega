'use server';

import { revalidatePath } from 'next/cache';
import { gabTableRepo } from '@/lib/core';
import type {
  GabTable,
  CreateTablePayload,
  UpdateTablePayload,
  RecomputeProgress,
} from '@/lib/core/ports/table.repository';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function fail<T>(label: string, err: unknown): ActionResult<T> {
  const message = err instanceof Error ? err.message : `Failed: ${label}`;
  console.error(`${label} error:`, message);
  return { success: false, error: message };
}

export async function listTablesAction(
  appId: string,
): Promise<ActionResult<{ items: GabTable[]; total: number }>> {
  try {
    return { success: true, data: await gabTableRepo.listTables(appId) };
  } catch (err) {
    return fail('listTablesAction', err);
  }
}

export async function getTableAction(
  appId: string,
  tableId: string,
): Promise<ActionResult<GabTable>> {
  try {
    return { success: true, data: await gabTableRepo.getTable(appId, tableId) };
  } catch (err) {
    return fail('getTableAction', err);
  }
}

export async function createTableAction(
  appId: string,
  payload: CreateTablePayload,
): Promise<ActionResult<GabTable>> {
  try {
    const data = await gabTableRepo.createTable(appId, payload);
    revalidatePath(`/apps/${appId}/tables`);
    return { success: true, data };
  } catch (err) {
    return fail('createTableAction', err);
  }
}

export async function updateTableAction(
  appId: string,
  tableId: string,
  payload: UpdateTablePayload,
): Promise<ActionResult<GabTable>> {
  try {
    const data = await gabTableRepo.updateTable(appId, tableId, payload);
    revalidatePath(`/apps/${appId}/tables/${tableId}`);
    revalidatePath(`/apps/${appId}/tables`);
    return { success: true, data };
  } catch (err) {
    return fail('updateTableAction', err);
  }
}

export async function deleteTableAction(
  appId: string,
  tableId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabTableRepo.deleteTable(appId, tableId);
    revalidatePath(`/apps/${appId}/tables`);
    return { success: true, data };
  } catch (err) {
    return fail('deleteTableAction', err);
  }
}

export async function recomputeAllAction(
  appId: string,
): Promise<ActionResult<RecomputeProgress | { tables: number; records: number }>> {
  try {
    return { success: true, data: await gabTableRepo.recomputeAll(appId) };
  } catch (err) {
    return fail('recomputeAllAction', err);
  }
}

export async function recomputeStatusAction(
  appId: string,
): Promise<ActionResult<RecomputeProgress>> {
  try {
    return { success: true, data: await gabTableRepo.recomputeStatus(appId) };
  } catch (err) {
    return fail('recomputeStatusAction', err);
  }
}
