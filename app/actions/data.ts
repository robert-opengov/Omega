'use server';

/**
 * Generic CRUD Server Actions backed by the gabDataRepo port.
 *
 * Use these for prototyping, simple verticals, or any page that just needs
 * rows from a GAB table without domain-specific logic.
 *
 * For mature verticals with dashboards, aggregations, or complex domain
 * rules, create a dedicated port + adapter instead (see the Grants vertical:
 * lib/core/ports/grants.repository.ts → lib/core/adapters/mock/grants.mock.adapter.ts).
 */

import { revalidatePath as nextRevalidatePath } from 'next/cache';
import { gabDataRepo } from '@/lib/core';
import type { GabRow, FetchRowsParams, SyncAction } from '@/lib/core/ports/data.repository';

export type { GabRow, FetchRowsParams, SyncAction };

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function fetchRowsAction(
  params: FetchRowsParams,
): Promise<{ success: boolean; data?: GabRow[]; total?: number; error?: string }> {
  try {
    const result = await gabDataRepo.fetchRows(params);
    return { success: true, data: result.data, total: result.total };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch rows.';
    console.error('fetchRowsAction error:', message);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createRowAction(
  tableKey: string,
  applicationKey: string,
  data: GabRow,
  pathToRevalidate?: string,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const result = await gabDataRepo.createRow(tableKey, applicationKey, data);
    if (pathToRevalidate) nextRevalidatePath(pathToRevalidate);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create row.';
    console.error('createRowAction error:', message);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateRowAction(
  tableKey: string,
  applicationKey: string,
  rowId: number,
  data: GabRow,
  pathToRevalidate?: string,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const result = await gabDataRepo.updateRow(tableKey, applicationKey, rowId, data);
    if (pathToRevalidate) nextRevalidatePath(pathToRevalidate);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update row.';
    console.error('updateRowAction error:', message);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteRowsAction(
  tableKey: string,
  applicationKey: string,
  rowIds: number[],
  pathToRevalidate?: string,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const result = await gabDataRepo.deleteRows(tableKey, applicationKey, rowIds);
    if (pathToRevalidate) nextRevalidatePath(pathToRevalidate);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete rows.';
    console.error('deleteRowsAction error:', message);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Sync (bulk)
// ---------------------------------------------------------------------------

export async function syncRowsAction(
  tableKey: string,
  applicationKey: string,
  actions: SyncAction[],
  pathToRevalidate?: string,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const result = await gabDataRepo.syncRows(tableKey, applicationKey, actions);
    if (pathToRevalidate) nextRevalidatePath(pathToRevalidate);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync rows.';
    console.error('syncRowsAction error:', message);
    return { success: false, error: message };
  }
}
