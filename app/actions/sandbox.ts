'use server';

import { revalidatePath } from 'next/cache';
import { gabSandboxRepo } from '@/lib/core';
import type {
  CreateSandboxPayload,
  PromoteSandboxPayload,
  SchemaBackup,
  SchemaDiff,
} from '@/lib/core/ports/sandbox.repository';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function fail(prefix: string, err: unknown): ActionResult<never> {
  const message = err instanceof Error ? err.message : prefix;
  console.error(prefix, message);
  return { success: false, error: message };
}

export async function createSandboxAction(
  appId: string,
  payload: CreateSandboxPayload,
): Promise<ActionResult<{ appId: string; appKey: string; dbName: string }>> {
  try {
    const data = await gabSandboxRepo.createSandbox(appId, payload);
    revalidatePath('/apps');
    revalidatePath(`/apps/${appId}`);
    return { success: true, data };
  } catch (err) {
    return fail('createSandboxAction error:', err);
  }
}

export async function getSandboxDiffAction(
  sandboxAppId: string,
): Promise<ActionResult<SchemaDiff>> {
  try {
    const data = await gabSandboxRepo.getSandboxDiff(sandboxAppId);
    return { success: true, data };
  } catch (err) {
    return fail('getSandboxDiffAction error:', err);
  }
}

export async function promoteSandboxAction(
  sandboxAppId: string,
  payload: PromoteSandboxPayload,
): Promise<ActionResult<{ promoted: boolean }>> {
  try {
    const data = await gabSandboxRepo.promoteSandbox(sandboxAppId, payload);
    revalidatePath('/apps');
    revalidatePath(`/apps/${sandboxAppId}`);
    return { success: true, data };
  } catch (err) {
    return fail('promoteSandboxAction error:', err);
  }
}

export async function discardSandboxAction(
  sandboxAppId: string,
): Promise<ActionResult<{ discarded: boolean }>> {
  try {
    const data = await gabSandboxRepo.discardSandbox(sandboxAppId);
    revalidatePath('/apps');
    revalidatePath(`/apps/${sandboxAppId}`);
    return { success: true, data };
  } catch (err) {
    return fail('discardSandboxAction error:', err);
  }
}

export async function listBackupsAction(
  appId: string,
): Promise<ActionResult<{ items: SchemaBackup[] }>> {
  try {
    const data = await gabSandboxRepo.listBackups(appId);
    return { success: true, data };
  } catch (err) {
    return fail('listBackupsAction error:', err);
  }
}

export async function restoreBackupAction(
  appId: string,
  backupId?: string,
): Promise<ActionResult<{ rolledBack: boolean }>> {
  try {
    const data = await gabSandboxRepo.restoreBackup(appId, backupId);
    revalidatePath(`/apps/${appId}`);
    revalidatePath(`/apps/${appId}/sandbox`);
    revalidatePath(`/apps/${appId}/settings/backups`);
    return { success: true, data };
  } catch (err) {
    return fail('restoreBackupAction error:', err);
  }
}

export async function exportSchemaAction(
  appId: string,
): Promise<ActionResult<Record<string, unknown>>> {
  try {
    const data = await gabSandboxRepo.exportSchema(appId);
    return { success: true, data };
  } catch (err) {
    return fail('exportSchemaAction error:', err);
  }
}

export async function importSchemaAction(
  appId: string,
  payload: Record<string, unknown>,
): Promise<ActionResult<{ imported: boolean }>> {
  try {
    const data = await gabSandboxRepo.importSchema(appId, payload);
    revalidatePath(`/apps/${appId}`);
    revalidatePath(`/apps/${appId}/sandbox`);
    revalidatePath(`/apps/${appId}/settings/backups`);
    return { success: true, data };
  } catch (err) {
    return fail('importSchemaAction error:', err);
  }
}
